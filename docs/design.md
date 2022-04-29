# Design

[Diagram Link](https://app.diagrams.net/#G1FPoNeNjMg8iW9TEJUE0Xy0ktF30eRs4n)

[Confluence Page](https://calmisland.atlassian.net/wiki/spaces/H/pages/2658959363/Media+Storage+Service)

## Upload Flow

**The client:**

- Generates a symmetric key and encrypts the media file with it
- Generates a key pair and requests the server's public key
- Encrypts the symmetric key asymmetrically
- Exchanges the media metadata, user public key, and encrypted symmetric key for a presigned upload URL
- Uploads the media to S3

**The server:**

- Stores the metadata, user public key, and encrypted symmetric in the database
- Generates a new server key pair for each room ID
- Stores the private key in an encrypted bucket and the public key in a separate bucket.

## Download Flow

- Client requests the symmetric key and a presigned download URL
- Upon receiving the request, the server decrypts the encrypted symmetric key using the user public key and the server private key
- Client downloads the encrypted media file and uses the decrypted symmetric key to decrypt the media file

## Authorization

**A user is authorized to download media if:**

- they were a teacher in the class
- OR they have the `view_completed_assessments_414` _organization_ permission
- OR they have the `view_completed_assessments_414` _school_ permission