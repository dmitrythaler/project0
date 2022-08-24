export const cookieToken = {
  name: 'token',
  in: 'cookie',
  required: true,
  description: 'Signed encrypted JWT in HTTP-only cookie',
  schema: {
    type: 'string'
  }
}
