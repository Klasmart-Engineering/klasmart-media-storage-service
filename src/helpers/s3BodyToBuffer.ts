import { Readable } from 'stream'

export default function s3BodyToBuffer(
  body: Readable | ReadableStream | Blob | undefined,
): Promise<Buffer> | undefined {
  const readable = body as Readable
  if (readable) {
    return new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = []
      readable.on('data', (chunk) => chunks.push(chunk))
      readable.once('end', () => resolve(Buffer.concat(chunks)))
      readable.once('error', reject)
    })
  }
}
