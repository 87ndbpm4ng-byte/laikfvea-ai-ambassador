import Foundation
import CoreImage
import ImageIO
import Vision

struct OCRLine: Codable {
    let text: String
    let confidence: Float
    let alternativeText: String?
    let alternativeConfidence: Float?
    let panel: Int
    let x: Double
    let y: Double
    let width: Double
    let height: Double
}

struct OCRPage: Codable {
    let page: Int
    let filename: String
    let lines: [OCRLine]
}

enum OCRFailure: Error, CustomStringConvertible {
    case imageLoad(String)
    case recognition(String)

    var description: String {
        switch self {
        case .imageLoad(let path):
            return "Unable to load image: \(path)"
        case .recognition(let message):
            return "Vision text recognition failed: \(message)"
        }
    }
}

func recognizePanel(image: CGImage, panel: Int) throws -> [OCRLine] {
    let panelWidth = image.width / 4
    let originX = panel * panelWidth
    let width = panel == 3 ? image.width - originX : panelWidth
    let cropRectangle = CGRect(x: originX, y: 0, width: width, height: image.height)
    guard let croppedImage = image.cropping(to: cropRectangle) else {
        throw OCRFailure.recognition("Unable to crop panel \(panel + 1).")
    }

    let request = VNRecognizeTextRequest()
    request.recognitionLevel = .accurate
    request.usesLanguageCorrection = false
    request.recognitionLanguages = ["en-US"]
    request.minimumTextHeight = 0.006

    do {
        try VNImageRequestHandler(cgImage: croppedImage, options: [:]).perform([request])
    } catch {
        throw OCRFailure.recognition(error.localizedDescription)
    }

    return (request.results ?? []).compactMap { observation -> OCRLine? in
        let candidates = observation.topCandidates(2)
        guard let candidate = candidates.first else {
            return nil
        }
        let alternative = candidates.count > 1 ? candidates[1] : nil
        let box = observation.boundingBox
        return OCRLine(
            text: candidate.string,
            confidence: candidate.confidence,
            alternativeText: alternative?.string,
            alternativeConfidence: alternative?.confidence,
            panel: panel,
            x: (Double(panel) + box.origin.x) / 4.0,
            y: box.origin.y,
            width: box.size.width / 4.0,
            height: box.size.height
        )
    }
}

func prepareImage(url: URL) throws -> CGImage {
    guard let input = CIImage(
        contentsOf: url,
        options: [.applyOrientationProperty: true]
    ) else {
        throw OCRFailure.imageLoad(url.path)
    }
    let controls = CIFilter(
        name: "CIColorControls",
        parameters: [
            kCIInputImageKey: input,
            kCIInputSaturationKey: 0.0,
            kCIInputContrastKey: 1.18,
            kCIInputBrightnessKey: 0.015,
        ]
    )?.outputImage ?? input
    let denoised = CIFilter(
        name: "CINoiseReduction",
        parameters: [
            kCIInputImageKey: controls,
            "inputNoiseLevel": 0.015,
            "inputSharpness": 0.55,
        ]
    )?.outputImage ?? controls
    let sharpened = CIFilter(
        name: "CISharpenLuminance",
        parameters: [
            kCIInputImageKey: denoised,
            kCIInputSharpnessKey: 0.38,
        ]
    )?.outputImage ?? denoised
    let context = CIContext(options: [.useSoftwareRenderer: false])
    guard let image = context.createCGImage(sharpened, from: sharpened.extent) else {
        throw OCRFailure.imageLoad(url.path)
    }
    return image
}

func recognize(path: String, page: Int) throws -> OCRPage {
    let url = URL(fileURLWithPath: path)
    let image = try prepareImage(url: url)

    var lines: [OCRLine] = []
    for panel in 0..<4 {
        lines.append(contentsOf: try recognizePanel(image: image, panel: panel))
    }
    return OCRPage(page: page, filename: url.lastPathComponent, lines: lines)
}

do {
    let paths = Array(CommandLine.arguments.dropFirst())
    guard !paths.isEmpty else {
        fputs("At least one image path is required.\n", stderr)
        exit(2)
    }
    let pages = try paths.enumerated().map { index, path in
        try recognize(path: path, page: index + 1)
    }
    let data = try JSONEncoder().encode(pages)
    FileHandle.standardOutput.write(data)
    FileHandle.standardOutput.write(Data([0x0A]))
} catch {
    fputs("\(error)\n", stderr)
    exit(1)
}
