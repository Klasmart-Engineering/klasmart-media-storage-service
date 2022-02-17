import { gql, GraphQLClient, ClientError } from 'graphql-request'

const graphQLClient = new GraphQLClient(
  'https://api.alpha.kidsloop.net/user/graphql',
)
const headers = {
  authorization:
    'eyJhbGciOiJSUzUxMiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEwYjc0NzkwLTk1MjgtNDViZS1iNDRmLTllMzQxMTA1YzFlOSIsImVtYWlsIjoiY2FiYXVtYW5Aa2lkc2xvb3AubGl2ZSIsImV4cCI6MTY0NDk5MjIyNCwiaXNzIjoia2lkc2xvb3AifQ.H7T5l5A8QnRAKrxN3Y36M7LNMUG60H9DqlWjqotu0CIBhxPR_lrx7ocDhaHQDKxrv1CShUqJtXBAArL3mZvkLhtGCSpWOF7eq3DHeYgugOq7swZB18huq_sW4jndDFYMIiTRVSR2ZV4U_kte9thhg-0As01UHI4uDBpY4HZb1q5DpmAdWWelcOc1_xzZQaEF-kLOp7R8CtBkSD9FJIlsG3T1aSTZvc3pe6AbZYQAtARydQzSgH7LvGstiMpqClQzgX-d6Ilb-xmj8hslMEEJvL6QhMyVzRQ5KE6FLcFK9TWu6FdVT9uLKc2omc383eJALZPJQOw1hbhu5X43i2OzTg',
}
// Henrik's organization
const organizationId = '49fbe89a-87bc-4159-8a8d-48bf151ba062'
const classId = '4f84e979-327d-446e-8b9e-e6f33a3d5080' // not henrik's class: 03ecb0dd-f765-4c76-9778-272f575c21f6
const permissionId = 'view_completed_assessments_414'

export const GET_HAS_ORG_PERMISSION = gql`
  query Query($organizationId: ID!, $classId: ID!, $permissionId: String!) {
    myUser {
      hasPermissionsInOrganization(
        organizationId: $organizationId
        permissionIds: [$permissionId]
      ) {
        allowed
      }
    }
    classNode(id: $classId) {
      schoolsConnection {
        edges {
          node {
            id
          }
        }
      }
    }
  }
`

async function debug() {
  const response = await graphQLClient.request(
    GET_HAS_ORG_PERMISSION,
    { organizationId, classId, permissionId },
    headers,
  )
  console.log(JSON.stringify(response, null, 2))
}

debug().catch((x) => {
  if (x instanceof ClientError) {
    console.log('ERROR: ' + JSON.stringify(x.response, null, 2))
  } else {
    console.log('ERROR: ' + 'an error occurred...')
  }
})
