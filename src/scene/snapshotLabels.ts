export interface SnapshotLabel {
  text: string
  x: number
  y: number
}

export interface LabelRect {
  x: number
  y: number
  width: number
  height: number
}

export const LABEL_FONT_SIZE = 12
const PADDING_X = 6
const PADDING_Y = 3
const RADIUS = 4

export function labelRect(label: SnapshotLabel, textWidth: number, scale: number): LabelRect {
  const width = textWidth + 2 * PADDING_X * scale
  const height = (LABEL_FONT_SIZE + 2 * PADDING_Y) * scale
  return { x: label.x * scale - width / 2, y: label.y * scale - height / 2, width, height }
}

export function drawLabels(
  context: CanvasRenderingContext2D,
  labels: readonly SnapshotLabel[],
  scale: number,
): void {
  context.font = `${LABEL_FONT_SIZE * scale}px "Instrument Sans", "Segoe UI", sans-serif`
  context.textAlign = 'center'
  context.textBaseline = 'middle'

  for (const label of labels) {
    const rect = labelRect(label, context.measureText(label.text).width, scale)
    context.fillStyle = 'rgb(255 255 255 / 88%)'
    context.beginPath()
    context.roundRect(rect.x, rect.y, rect.width, rect.height, RADIUS * scale)
    context.fill()
    context.fillStyle = '#1d2b2a'
    context.fillText(label.text, label.x * scale, label.y * scale)
  }
}

export function visibleLabels(elements: Iterable<HTMLElement>, origin: DOMRect): SnapshotLabel[] {
  return [...elements]
    .filter((element) => element.style.visibility !== 'hidden')
    .map((element) => {
      const rect = element.getBoundingClientRect()
      return {
        text: element.textContent ?? '',
        x: rect.left + rect.width / 2 - origin.left,
        y: rect.top + rect.height / 2 - origin.top,
      }
    })
}
