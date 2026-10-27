// PDF → 페이지별 JPG (공모전 설명집 책 넘기기용)
//
//   swift scripts/pdf-to-pages.swift <입력.pdf> <출력폴더> [가로픽셀=1400] [품질=0.8]
//
// 출력: page-01.jpg, page-02.jpg … (macOS 기본 PDFKit 사용, 추가 설치 없음)
import AppKit
import PDFKit

let args = CommandLine.arguments
guard args.count >= 3, let doc = PDFDocument(url: URL(fileURLWithPath: args[1])) else {
  FileHandle.standardError.write("사용법: swift scripts/pdf-to-pages.swift <입력.pdf> <출력폴더> [가로픽셀] [품질]\n".data(using: .utf8)!)
  exit(1)
}
let outDir = URL(fileURLWithPath: args[2], isDirectory: true)
let targetWidth = args.count > 3 ? CGFloat(Double(args[3]) ?? 1400) : 1400
let quality = args.count > 4 ? Double(args[4]) ?? 0.8 : 0.8
try FileManager.default.createDirectory(at: outDir, withIntermediateDirectories: true)

let digits = max(2, String(doc.pageCount).count)
for i in 0..<doc.pageCount {
  guard let page = doc.page(at: i) else { continue }
  let box = page.bounds(for: .cropBox)
  let scale = targetWidth / box.width
  let w = Int(box.width * scale), h = Int(box.height * scale)

  guard let rep = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: w, pixelsHigh: h, bitsPerSample: 8,
                                   samplesPerPixel: 4, hasAlpha: true, isPlanar: false,
                                   colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0),
        let ctx = NSGraphicsContext(bitmapImageRep: rep) else { continue }

  NSGraphicsContext.saveGraphicsState()
  NSGraphicsContext.current = ctx
  let cg = ctx.cgContext
  cg.setFillColor(NSColor.white.cgColor)
  cg.fill(CGRect(x: 0, y: 0, width: w, height: h))
  cg.scaleBy(x: scale, y: scale)
  cg.translateBy(x: -box.minX, y: -box.minY)
  page.draw(with: .cropBox, to: cg)
  NSGraphicsContext.restoreGraphicsState()

  let name = String(format: "page-%0\(digits)d.jpg", i + 1)
  if let data = rep.representation(using: .jpeg, properties: [.compressionFactor: quality]) {
    try data.write(to: outDir.appendingPathComponent(name))
    print("  \(name)  \(w)×\(h)")
  }
}
print("✅ \(doc.pageCount)쪽 변환 완료 → \(outDir.path)")
