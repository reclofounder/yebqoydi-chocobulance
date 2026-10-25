// Renders one PDF page to a transparent sRGB PNG with Quartz (ColorSync colour management).
// Usage: swift render.swift <in.pdf> <page 1-based> <scale> <out.png>
import Foundation
import CoreGraphics
import ImageIO
import UniformTypeIdentifiers

let args = CommandLine.arguments
let url = URL(fileURLWithPath: args[1])
let pageNo = Int(args[2])!
let scale = CGFloat(Double(args[3])!)
guard let doc = CGPDFDocument(url as CFURL), let page = doc.page(at: pageNo) else { fatalError("no page") }
let box = page.getBoxRect(.cropBox)
let w = Int((box.width * scale).rounded()), h = Int((box.height * scale).rounded())
let cs = CGColorSpace(name: CGColorSpace.sRGB)!
let ctx = CGContext(data: nil, width: w, height: h, bitsPerComponent: 8, bytesPerRow: 0, space: cs,
                    bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
ctx.clear(CGRect(x: 0, y: 0, width: w, height: h))
ctx.interpolationQuality = .high
ctx.scaleBy(x: scale, y: scale)
ctx.translateBy(x: -box.minX, y: -box.minY)
ctx.drawPDFPage(page)
let img = ctx.makeImage()!
let dest = CGImageDestinationCreateWithURL(URL(fileURLWithPath: args[4]) as CFURL, UTType.png.identifier as CFString, 1, nil)!
CGImageDestinationAddImage(dest, img, nil)
CGImageDestinationFinalize(dest)
print(w, h)
