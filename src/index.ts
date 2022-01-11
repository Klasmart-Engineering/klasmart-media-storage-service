import 'newrelic'
import 'reflect-metadata'
import { Config } from './initialization/config'
import { connectToMetadataDatabase } from './initialization/connectToMetadataDatabase'
import createAudioServer from './initialization/createAudioServer'

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
