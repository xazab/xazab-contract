const { expect } = require('chai');
const XazabPlatformProtocol = require('@xazab/dpp');
const generateRandomIdentifier = require('@xazab/dpp/lib/test/utils/generateRandomIdentifier');
const schema = require('./xazab.schema');

const whitepaperMasternodeText = 'Full nodes are servers running on a P2P network that allow peers to use them to receive updates about the events on the network. These nodes utilize significant amounts of traffic and other resources that incur a substantial cost. As a result, a steady decrease in the amount of these nodes has been observed for some time on the Bitcoin network and as a result, block propagation times have been upwards of 40 seconds. Many solutions have been proposed such as a new reward scheme by Microsoft Research and the Bitnodes incentive program';
const encoded32Chars = '4fafc98bbfe597f7ba2c9f767d52036d';
const encoded64Chars = '4fafc98bbfe597f7ba2c9f767d52036d2226175960a908e355e5c575711eb166';

const filteredObject = (inputObj) => {
  const filteredEntries = Object
    .entries(inputObj)
    .filter((el) => el[0][0] !== '$');

  return Object
    .fromEntries(filteredEntries);
};

describe('Xazabpay Contract', () => {
  let dpp;
  let contract;
  let identityId;

  beforeEach(function beforeEach() {
    const fetchContractStub = this.sinon.stub();

    dpp = new XazabPlatformProtocol({
      stateRepository: {
        fetchDataContract: fetchContractStub,
      },
    });

    identityId = generateRandomIdentifier();

    contract = dpp.dataContract.create(identityId, schema);

    fetchContractStub.resolves(contract);
  });

  it('should have a valid contract definition', async () => {
    const validationResult = await dpp.dataContract.validate(contract);
    expect(validationResult.isValid()).to.be.true();
  });
  describe('Documents', () => {
    describe('Profile', () => {
      let profileData;

      beforeEach(() => {
        profileData = {
          displayName: 'Bob',
          publicMessage: 'Hello Xazabpay!',
        };
      });
      describe('displayName', () => {
        it('can be avoided', async () => {
          delete profileData.displayName;
          const profile = dpp.document.create(contract, identityId, 'profile', profileData);
          expect(filteredObject(profile.toObject())).to.deep.equal(profileData);
        });
        it('can be empty', async () => {
          profileData.displayName = '';
          const profile = dpp.document.create(contract, identityId, 'profile', profileData);
          expect(filteredObject(profile.toObject())).to.deep.equal(profileData);
        });
        it('should have less than 25 chars length', async () => {
          profileData.displayName = 'AliceAndBobAndCarolAndDanAndEveAndFrankAndIvanAndMikeAndWalterAndWendy';
          try {
            dpp.document.create(contract, identityId, 'profile', profileData);
            throw new Error('Expected error');
          } catch (e) {
            expect(e.name).to.equal('InvalidDocumentError');
            expect(e.errors).to.have.a.lengthOf(1);
            const [error] = e.errors;
            expect(error.name).to.equal('JsonSchemaError');
            expect(error.keyword).to.equal('maxLength');
            expect(error.dataPath).to.equal('.displayName');
          }
        });
      });
      describe('publicMessage', () => {
        it('can be avoided', async () => {
          delete profileData.publicMessage;
          dpp.document.create(contract, identityId, 'profile', profileData);
        });
        it('can be empty', async () => {
          profileData.publicMessage = '';
          dpp.document.create(contract, identityId, 'profile', profileData);
        });
        it('should have less than 256 chars length', async () => {
          profileData.publicMessage = whitepaperMasternodeText;
          try {
            dpp.document.create(contract, identityId, 'profile', profileData);
            throw new Error('Expected error');
          } catch (e) {
            expect(e.name).to.equal('InvalidDocumentError');
            expect(e.errors).to.have.a.lengthOf(1);
            const [error] = e.errors;
            expect(error.name).to.equal('JsonSchemaError');
            expect(error.keyword).to.equal('maxLength');
            expect(error.dataPath).to.equal('.publicMessage');
          }
        });
      });
      describe('avatarUrl', () => {
        it('should not be empty', async () => {
          profileData.avatarUrl = '';

          try {
            dpp.document.create(contract, identityId, 'profile', profileData);
            throw new Error('Expected error');
          } catch (e) {
            expect(e.name).to.equal('InvalidDocumentError');
            expect(e.errors).to.have.a.lengthOf(1);
            const [error] = e.errors;
            expect(error.name).to.equal('JsonSchemaError');
            expect(error.keyword).to.equal('format');
            expect(error.dataPath).to.equal('.avatarUrl');
          }
        });
        it('should have less than 2048 chars length', async () => {
          profileData.avatarUrl = `https://github.com/xazab/xazab/wiki/Whitepaper?text=${encodeURI(whitepaperMasternodeText)}${encodeURI(whitepaperMasternodeText)}${encodeURI(whitepaperMasternodeText)}${encodeURI(whitepaperMasternodeText)}${encodeURI(whitepaperMasternodeText)}`;

          try {
            dpp.document.create(contract, identityId, 'profile', profileData);
            throw new Error('Expected error');
          } catch (e) {
            expect(e.name).to.equal('InvalidDocumentError');
            expect(e.errors).to.have.a.lengthOf(1);
            const [error] = e.errors;
            expect(error.name).to.equal('JsonSchemaError');
            expect(error.keyword).to.equal('maxLength');
            expect(error.dataPath).to.equal('.avatarUrl');
          }
        });
        it('should be of type URL', async () => {
          profileData.avatarUrl = 'notAUrl';
          try {
            dpp.document.create(contract, identityId, 'profile', profileData);
            throw new Error('Expected error');
          } catch (e) {
            expect(e.name).to.equal('InvalidDocumentError');
            expect(e.errors).to.have.a.lengthOf(1);
            const [error] = e.errors;
            expect(error.name).to.equal('JsonSchemaError');
            expect(error.keyword).to.equal('format');
            expect(error.dataPath).to.equal('.avatarUrl');
          }
        });
      });
      it('should not have additional properties', async () => {
        profileData.someOtherProperty = 42;

        try {
          dpp.document.create(contract, identityId, 'profile', profileData);
          throw new Error('Expected error');
        } catch (e) {
          expect(e.name).to.equal('InvalidDocumentError');
          expect(e.errors).to.have.a.lengthOf(1);
          const [error] = e.errors;
          expect(error.name).to.equal('JsonSchemaError');
          expect(error.keyword).to.equal('additionalProperties');
          expect(error.params.additionalProperty).to.equal('someOtherProperty');
        }
      });
      it('should be valid', async () => {
        const profile = dpp.document.create(contract, identityId, 'profile', profileData);

        const result = await dpp.document.validate(profile);

        expect(result.isValid()).to.be.true();
      });
    });

    describe('Contact info', () => {
      let contactInfoData;

      beforeEach(() => {
        contactInfoData = {
          encToUserId: Buffer.alloc(32),
          privateData: Buffer.alloc(48),
          rootEncryptionKeyIndex: 0,
          derivationEncryptionKeyIndex: 0,
        };
      });
      describe('encToUserId', () => {
        it('should be defined', async () => {
          delete contactInfoData.encToUserId;

          try {
            dpp.document.create(contract, identityId, 'contactInfo', contactInfoData);
            throw new Error('Expected error');
          } catch (e) {
            expect(e.name).to.equal('InvalidDocumentError');
            expect(e.errors).to.have.a.lengthOf(1);
            const [error] = e.errors;

            expect(error.name).to.equal('JsonSchemaError');
            expect(error.keyword).to.equal('required');
            expect(error.params.missingProperty).to.equal('encToUserId');
          }
        });
        it('should have exactly 32 chars length', async () => {
          contactInfoData.encToUserId = Buffer.from(`${encoded64Chars}11`, 'hex');

          try {
            dpp.document.create(contract, identityId, 'contactInfo', contactInfoData);
            throw new Error('Expected error');
          } catch (e) {
            expect(e.name).to.equal('InvalidDocumentError');
            expect(e.errors).to.have.a.lengthOf(1);
            const [error] = e.errors;

            expect(error.name).to.equal('JsonSchemaError');
            expect(error.keyword).to.equal('maxItems');
            expect(error.dataPath).to.equal('.encToUserId');
          }
        });
        it('should have more or 32 chars length', async () => {
          contactInfoData.encToUserId = Buffer.from(encoded32Chars, 'hex');

          try {
            dpp.document.create(contract, identityId, 'contactInfo', contactInfoData);
            throw new Error('Expected error');
          } catch (e) {
            expect(e.name).to.equal('InvalidDocumentError');
            expect(e.errors).to.have.a.lengthOf(1);
            const [error] = e.errors;

            expect(error.name).to.equal('JsonSchemaError');
            expect(error.keyword).to.equal('minItems');
            expect(error.dataPath).to.equal('.encToUserId');
          }
        });
      });
      describe('rootEncryptionKeyIndex', () => {
        it('should be defined', async () => {
          delete contactInfoData.rootEncryptionKeyIndex;

          try {
            dpp.document.create(contract, identityId, 'contactInfo', contactInfoData);
            throw new Error('Expected error');
          } catch (e) {
            expect(e.name).to.equal('InvalidDocumentError');
            expect(e.errors).to.have.a.lengthOf(1);
            const [error] = e.errors;
            expect(error.name).to.equal('JsonSchemaError');
            expect(error.keyword).to.equal('required');
            expect(error.params.missingProperty).to.equal('rootEncryptionKeyIndex');
          }
        });
        it('should not be less than 0', async () => {
          contactInfoData.rootEncryptionKeyIndex = -1;

          try {
            dpp.document.create(contract, identityId, 'contactInfo', contactInfoData);
            throw new Error('Expected error');
          } catch (e) {
            expect(e.name).to.equal('InvalidDocumentError');
            expect(e.errors).to.have.a.lengthOf(1);
            const [error] = e.errors;
            expect(error.name).to.equal('JsonSchemaError');
            expect(error.keyword).to.equal('minimum');
            expect(error.dataPath).to.equal('.rootEncryptionKeyIndex');
          }
        });
      });
      describe('privateData', () => {
        it('should be defined', async () => {
          delete contactInfoData.privateData;

          try {
            dpp.document.create(contract, identityId, 'contactInfo', contactInfoData);
            throw new Error('Expected error');
          } catch (e) {
            expect(e.name).to.equal('InvalidDocumentError');
            expect(e.errors).to.have.a.lengthOf(1);
            const [error] = e.errors;
            expect(error.name).to.equal('JsonSchemaError');
            expect(error.keyword).to.equal('required');
            expect(error.params.missingProperty).to.equal('privateData');
          }
        });
      });
      it('should not have additional properties', async () => {
        contactInfoData.someOtherProperty = 42;

        try {
          dpp.document.create(contract, identityId, 'contactInfo', contactInfoData);
          throw new Error('Expected error');
        } catch (e) {
          expect(e.name).to.equal('InvalidDocumentError');
          expect(e.errors).to.have.a.lengthOf(1);
          const [error] = e.errors;
          expect(error.name).to.equal('JsonSchemaError');
          expect(error.keyword).to.equal('additionalProperties');
          expect(error.params.additionalProperty).to.equal('someOtherProperty');
        }
      });
    });
    describe('Contact Request', () => {
      let contactRequestData;

      beforeEach(() => {
        contactRequestData = {
          toUserId: Buffer.alloc(32),
          encryptedPublicKey: Buffer.alloc(96),
          senderKeyIndex: 0,
          recipientKeyIndex: 0,
          accountReference: 0,
        };
      });
      describe('toUserId', () => {
        it('should be defined', async () => {
          delete contactRequestData.toUserId;

          try {
            dpp.document.create(contract, identityId, 'contactRequest', contactRequestData);
            throw new Error('Expected error');
          } catch (e) {
            expect(e.name).to.equal('InvalidDocumentError');
            expect(e.errors).to.have.a.lengthOf(1);
            const [error] = e.errors;
            expect(error.name).to.equal('JsonSchemaError');
            expect(error.keyword).to.equal('required');
            expect(error.params.missingProperty).to.equal('toUserId');
          }
        });
      });
      describe('encryptedPublicKey', () => {
        it('should be defined', async () => {
          delete contactRequestData.encryptedPublicKey;

          try {
            dpp.document.create(contract, identityId, 'contactRequest', contactRequestData);
            throw new Error('Expected error');
          } catch (e) {
            expect(e.name).to.equal('InvalidDocumentError');
            expect(e.errors).to.have.a.lengthOf(1);
            const [error] = e.errors;
            expect(error.name).to.equal('JsonSchemaError');
            expect(error.keyword).to.equal('required');
            expect(error.params.missingProperty).to.equal('encryptedPublicKey');
          }
        });
      });
      describe('senderKeyIndex', () => {
        it('should be defined', async () => {
          delete contactRequestData.senderKeyIndex;

          try {
            dpp.document.create(contract, identityId, 'contactRequest', contactRequestData);
            throw new Error('Expected error');
          } catch (e) {
            expect(e.name).to.equal('InvalidDocumentError');
            expect(e.errors).to.have.a.lengthOf(1);
            const [error] = e.errors;
            expect(error.name).to.equal('JsonSchemaError');
            expect(error.keyword).to.equal('required');
            expect(error.params.missingProperty).to.equal('senderKeyIndex');
          }
        });
        it('should not be less than 0', async () => {
          contactRequestData.senderKeyIndex = -1;

          try {
            dpp.document.create(contract, identityId, 'contactRequest', contactRequestData);
            throw new Error('Expected error');
          } catch (e) {
            expect(e.name).to.equal('InvalidDocumentError');
            expect(e.errors).to.have.a.lengthOf(1);
            const [error] = e.errors;
            expect(error.name).to.equal('JsonSchemaError');
            expect(error.keyword).to.equal('minimum');
            expect(error.dataPath).to.equal('.senderKeyIndex');
          }
        });
      });
      describe('recipientKeyIndex', () => {
        it('should be defined', async () => {
          delete contactRequestData.recipientKeyIndex;

          try {
            dpp.document.create(contract, identityId, 'contactRequest', contactRequestData);
            throw new Error('Expected error');
          } catch (e) {
            expect(e.name).to.equal('InvalidDocumentError');
            expect(e.errors).to.have.a.lengthOf(1);
            const [error] = e.errors;
            expect(error.name).to.equal('JsonSchemaError');
            expect(error.keyword).to.equal('required');
            expect(error.params.missingProperty).to.equal('recipientKeyIndex');
          }
        });
        it('should not be less than 0', async () => {
          contactRequestData.recipientKeyIndex = -1;

          try {
            dpp.document.create(contract, identityId, 'contactRequest', contactRequestData);
            throw new Error('Expected error');
          } catch (e) {
            expect(e.name).to.equal('InvalidDocumentError');
            expect(e.errors).to.have.a.lengthOf(1);
            const [error] = e.errors;
            expect(error.name).to.equal('JsonSchemaError');
            expect(error.keyword).to.equal('minimum');
            expect(error.dataPath).to.equal('.recipientKeyIndex');
          }
        });
      });
      it('should not have additional properties', async () => {
        contactRequestData.someOtherProperty = 42;

        try {
          dpp.document.create(contract, identityId, 'contactRequest', contactRequestData);
          throw new Error('Expected error');
        } catch (e) {
          expect(e.name).to.equal('InvalidDocumentError');
          expect(e.errors).to.have.a.lengthOf(1);
          const [error] = e.errors;

          expect(error.name).to.equal('JsonSchemaError');
          expect(error.keyword).to.equal('additionalProperties');
          expect(error.params.additionalProperty).to.equal('someOtherProperty');
        }
      });
    });
  });
});
