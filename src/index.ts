import 'reflect-metadata'
import { Config } from './helpers/config'
import { connectToMetadataDatabase } from './helpers/connectToMetadataDatabase'
import createAudioServer from './helpers/createAudioServer'

async function main() {
  const { app, server } = await createAudioServer()
  await connectToMetadataDatabase(Config.getMetadataDatabaseUrl())

  const port = process.env.PORT || 8081
  app.listen(port, () => {
    console.log(
      `🌎 Server ready at http://localhost:${port}${server.graphqlPath}`,
    )
  })
}

main().catch((e) => {
  console.error(e)
  process.exit(-1)
})
