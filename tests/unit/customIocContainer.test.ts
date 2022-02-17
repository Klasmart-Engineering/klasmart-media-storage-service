import Substitute from '@fluffy-spoon/substitute'
import { expect } from 'chai'
import { CustomIocContainer } from '../../src/initialization/buildDefaultSchema'
import { CompositionRoot } from '../../src/initialization/compositionRoot'
import { AudioResolver } from '../../src/resolvers/audioResolver'

describe('CustomIocContainer.get', () => {
  context('objectType is AudioResolver', () => {
    it('returns instance of AudioResolver', async () => {
      //Arrange
      const compositionRoot = Substitute.for<CompositionRoot>()
      const sut = new CustomIocContainer(compositionRoot)

      const audioResolver = Substitute.for<AudioResolver>()
      compositionRoot.getAudioResolver().resolves(audioResolver)

      // Act
      const actual = await sut.get(AudioResolver)

      // Assert
      expect(actual).to.equal(audioResolver)
    })
  })

  context('objectType is not AudioResolver', () => {
    it('returns undefined', async () => {
      //Arrange
      const compositionRoot = Substitute.for<CompositionRoot>()
      const sut = new CustomIocContainer(compositionRoot)

      const audioResolver = Substitute.for<AudioResolver>()
      compositionRoot.getAudioResolver().resolves(audioResolver)

      // Act
      const actual = await sut.get(CompositionRoot)

      // Assert
      expect(actual).to.be.undefined
    })
  })
})
