import * as fs from 'fs'
import * as path from 'path'
import Jimp, { read } from 'jimp'
import { mergeImages } from './merge-images'
import { fromBuffer } from 'pdf2pic'
import { ToBase64Response } from 'pdf2pic/dist/types/toBase64Response'

export async function pdf2png(pdf: string | Buffer): Promise<ReadonlyArray<Jimp>> {
  const getBase64s = fromBuffer(Buffer.isBuffer(pdf) ? pdf : fs.readFileSync(pdf), {
    format: 'png',
    density: 150,
    width: 1190,
    height: 1684,
  })

  const base64Response: ToBase64Response[] = (await getBase64s.bulk?.(-1, true)) ?? []

  const base64s: string[] = base64Response.filter((x) => x.base64).map((x) => x.base64 || '')

  return Promise.all(base64s.map((x) => read(Buffer.from(x, 'base64'))))
}

export const writeImages =
  (outputImagePath: string, combinePages = true) =>
  (images: ReadonlyArray<Jimp>): Promise<ReadonlyArray<Jimp>> => {
    if (combinePages === true) {
      return mergeImages(images)
        .writeAsync(outputImagePath)
        .then(() => images)
    }

    const parsedPath = path.parse(outputImagePath)
    const partialName = path.join(parsedPath.dir, parsedPath.name)
    const padMaxLen = images.length.toString().length
    return Promise.all(
      images.map((img, idx) =>
        img.writeAsync(`${partialName}_${String(idx + 1).padStart(padMaxLen, '0')}.png`),
      ),
    ).then(() => images)
  }
