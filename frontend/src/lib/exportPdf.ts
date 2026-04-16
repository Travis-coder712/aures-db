/**
 * PDF Export Utility
 * Captures a DOM element as a light-mode image and generates a multi-page PDF.
 * Uses html-to-image for DOM capture and jsPDF for PDF generation.
 */
import { toPng } from 'html-to-image'
import { jsPDF } from 'jspdf'

// Light-mode CSS variable overrides for PDF readability
const LIGHT_MODE_VARS: Record<string, string> = {
  '--color-bg': '#ffffff',
  '--color-bg-card': '#f8fafc',
  '--color-bg-elevated': '#e2e8f0',
  '--color-bg-card-hover': '#f1f5f9',
  '--color-text': '#0f172a',
  '--color-text-muted': '#475569',
  '--color-border': '#cbd5e1',
  '--color-accent': '#d97706',
  '--color-primary': '#0369a1',
}

interface ExportOptions {
  /** Filename without .pdf extension */
  filename: string
  /** Title printed at top of first page */
  title?: string
  /** Subtitle / date line */
  subtitle?: string
  /** Scale factor for image capture (higher = better quality, slower) */
  scale?: number
  /** Page margin in mm */
  margin?: number
}

/**
 * Export a DOM element to a downloadable PDF.
 * Temporarily applies light-mode styling for readability.
 */
export async function exportElementToPdf(
  element: HTMLElement,
  options: ExportOptions
): Promise<void> {
  const {
    filename,
    title,
    subtitle,
    scale = 2,
    margin = 10,
  } = options

  // 1. Store original styles and apply light-mode overrides
  const originalStyles: Record<string, string> = {}
  for (const [prop, value] of Object.entries(LIGHT_MODE_VARS)) {
    originalStyles[prop] = element.style.getPropertyValue(prop)
    element.style.setProperty(prop, value)
  }

  // Also set explicit background on the element
  const originalBg = element.style.backgroundColor
  const originalColor = element.style.color
  element.style.backgroundColor = '#ffffff'
  element.style.color = '#0f172a'

  // Force all child elements with inline color styles to also adapt
  // (Recharts SVG text elements often have explicit fills)
  const svgTexts = element.querySelectorAll('svg text, svg tspan')
  const originalFills: Array<{ el: Element; fill: string }> = []
  svgTexts.forEach(el => {
    const htmlEl = el as SVGElement
    const fill = htmlEl.getAttribute('fill') || ''
    if (fill && (fill.includes('var(--color-text-muted)') || fill === 'var(--color-text-muted)')) {
      originalFills.push({ el, fill })
      htmlEl.setAttribute('fill', '#475569')
    } else if (fill && (fill.includes('var(--color-text)') || fill === 'var(--color-text)')) {
      originalFills.push({ el, fill })
      htmlEl.setAttribute('fill', '#0f172a')
    }
  })

  // Wait a tick for styles to apply
  await new Promise(r => setTimeout(r, 100))

  try {
    // 2. Capture the element as a PNG data URL
    const dataUrl = await toPng(element, {
      pixelRatio: scale,
      backgroundColor: '#ffffff',
      skipFonts: true, // avoid CORS errors from Google Fonts
      style: {
        transform: 'none',
      },
      filter: (node) => {
        // Skip nav elements, bottom bars etc
        if (node instanceof HTMLElement) {
          const cl = node.className
          if (typeof cl === 'string' && cl.includes('bottom-nav')) return false
        }
        return true
      },
    })

    // 3. Load image to get dimensions
    const img = new Image()
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = reject
      img.src = dataUrl
    })

    // 4. Create PDF
    // A4 dimensions in mm: 210 x 297
    const pageWidth = 210
    const pageHeight = 297
    const contentWidth = pageWidth - margin * 2
    const contentHeight = pageHeight - margin * 2

    // Calculate image dimensions to fit page width
    const imgAspect = img.height / img.width
    const pdfImgWidth = contentWidth
    const pdfImgHeight = contentWidth * imgAspect

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    })

    // Title header on first page
    let yOffset = margin
    if (title) {
      pdf.setFontSize(16)
      pdf.setTextColor(15, 23, 42) // slate-900
      pdf.text(title, margin, yOffset + 5)
      yOffset += 8
    }
    if (subtitle) {
      pdf.setFontSize(9)
      pdf.setTextColor(71, 85, 105) // slate-600
      pdf.text(subtitle, margin, yOffset + 4)
      yOffset += 7
    }
    if (title || subtitle) {
      // Divider line
      pdf.setDrawColor(203, 213, 225) // slate-300
      pdf.line(margin, yOffset + 1, pageWidth - margin, yOffset + 1)
      yOffset += 4
    }

    // Calculate how many pages we need
    const firstPageContent = contentHeight - (yOffset - margin)
    const totalImageHeight = pdfImgHeight

    if (totalImageHeight <= firstPageContent) {
      // Fits on one page
      pdf.addImage(dataUrl, 'PNG', margin, yOffset, pdfImgWidth, pdfImgHeight)
    } else {
      // Multi-page: slice the image across pages
      // We use the source image coordinates to crop sections
      const pxPerMm = img.width / pdfImgWidth

      let remainingHeight = totalImageHeight
      let srcY = 0
      let isFirstPage = true

      while (remainingHeight > 0) {
        const availableHeight = isFirstPage ? firstPageContent : contentHeight
        const sliceHeight = Math.min(remainingHeight, availableHeight)
        const srcSliceHeight = sliceHeight * pxPerMm

        // Create a canvas to slice the image
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = Math.ceil(srcSliceHeight)
        const ctx = canvas.getContext('2d')!
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(
          img,
          0, srcY, img.width, Math.ceil(srcSliceHeight),
          0, 0, img.width, Math.ceil(srcSliceHeight)
        )

        const sliceDataUrl = canvas.toDataURL('image/png')
        const pageY = isFirstPage ? yOffset : margin

        pdf.addImage(sliceDataUrl, 'PNG', margin, pageY, pdfImgWidth, sliceHeight)

        remainingHeight -= sliceHeight
        srcY += srcSliceHeight

        if (remainingHeight > 0) {
          pdf.addPage()
        }

        isFirstPage = false
      }
    }

    // Footer on last page
    const pageCount = pdf.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i)
      pdf.setFontSize(7)
      pdf.setTextColor(148, 163, 184) // slate-400
      pdf.text(
        `AURES Intelligence | ${filename} | Page ${i} of ${pageCount}`,
        margin,
        pageHeight - 5
      )
    }

    // 5. Download
    pdf.save(`${filename}.pdf`)

  } finally {
    // 6. Restore original styles
    for (const [prop, value] of Object.entries(originalStyles)) {
      if (value) {
        element.style.setProperty(prop, value)
      } else {
        element.style.removeProperty(prop)
      }
    }
    element.style.backgroundColor = originalBg
    element.style.color = originalColor

    // Restore SVG fills
    originalFills.forEach(({ el, fill }) => {
      ;(el as SVGElement).setAttribute('fill', fill)
    })
  }
}
