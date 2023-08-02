import { schema as schemaV1 } from './schema-v1.js'
import { componentSchemas } from './components.js'

export const api = {
  openapi: '3.1.0',
  info: {
    title: 'Project0, API contracts',
    description: '',
    version: '1.0.0',
    contact: {
      email: 'nobody@nowhere.net'
    }
  },
  tags: [
    {
      name: 'Root',
      description: 'Root operations'
    },
    {
      name: 'User',
      description: 'Operations based on user'
    },
    {
      name: 'Square',
      description: 'Operations for interacting with Square, the payment processor'
    },
    {
      name: 'Audit',
      description: 'Operations based on actions Audit'
    }
  ],
  paths: {
    ...schemaV1
  },
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'token',
        description: 'Signed encrypted JWT in HTTP-only cookie'
      }
    },
    schemas: componentSchemas
  }
}
