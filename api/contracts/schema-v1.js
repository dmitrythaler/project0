
import { cookieToken } from './parameters.js'
import { error400, error401, error403, error500, createResponse } from './responses.js'

export const schema = {
  '/api/v1/user': {
    post: {
      tags: ['user'],
      summary: 'POST new User',
      operationId: 'postCreateNewUser',
      parameters: [
        cookieToken
      ],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/UserCreate'
            }
          }
        },
        required: true
      },
      responses: {
        ...createResponse(200, 'Successfully created User', {
          type: 'object',
          properties: {
            user: {
              $ref: '#/components/schemas/UserRecord'
            }
          }
        }),
        ...error400,
        ...error401,
        ...error403,
        ...error500
      }
    }
  },
  '/api/v1/user/list': {
    get: {
      tags: ['user'],
      summary: 'GET list of Users',
      operationId: 'getUserList',
      parameters: [
        cookieToken
      ],
      responses: {
        ...createResponse(200, 'Successfully retrieved User List', {
          type: 'object',
          properties: {
            users: {
              $ref: '#/components/schemas/UserList'
            }
          }
        }),
        ...error400,
        ...error401,
        ...error500
      }
    }
  },
  '/api/v1/user/id/{userId}': {
    get: {
      tags: ['user'],
      summary: 'GET User by Id',
      operationId: 'getUserById',
      parameters: [
        cookieToken,
        {
          name: 'userId',
          in: 'path',
          required: true,
          description: 'The User ID',
          schema: {
            type: 'string'
          }
        }
      ],
      responses: {
        ...createResponse(200, 'Successfully retrieved User', {
          type: 'object',
          properties: {
            user: {
              $ref: '#/components/schemas/UserRecord'
            }
          }
        }),
        ...error400,
        ...error401,
        ...error403,
        ...error500
      }

    }
  },
  '/api/v1/user/email/{userEmail}': {
    get: {
      tags: ['user'],
      summary: 'GET User by Email',
      operationId: 'getUserByEmail',
      parameters: [
        cookieToken,
        {
          name: 'userEmail',
          in: 'path',
          required: true,
          description: 'The User\'s Email',
          schema: {
            type: 'string'
          }
        }
      ],
      responses: {
        ...createResponse(200, 'Successfully retrieved User', {
          type: 'object',
          properties: {
            user: {
              $ref: '#/components/schemas/UserRecord'
            }
          }
        }),
        ...error400,
        ...error401,
        ...error403,
        ...error500
      }
    }
  },
  '/api/v1/user/{userId}': {
    patch: {
      tags: ['user'],
      summary: 'PATCH User',
      operationId: 'patchUpdateUser',
      parameters: [
        cookieToken,
        {
          name: 'userId',
          in: 'path',
          required: true,
          description: 'The User ID',
          schema: {
            type: 'string'
          }
        }
      ],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/UserBase'
            }
          }
        },
        required: true
      },
      responses: {
        ...createResponse(200, 'Successfully updated User', {
          type: 'object',
          properties: {
            user: {
              $ref: '#/components/schemas/UserRecord'
            }
          }
        }),
        ...error400,
        ...error401,
        ...error403,
        ...error500
      }
    },
    delete: {
      tags: ['user'],
      summary: 'DELETE User by Id',
      operationId: 'deleteUserById',
      parameters: [
        cookieToken,
        {
          name: 'userId',
          in: 'path',
          required: true,
          description: 'The User ID',
          schema: {
            type: 'string'
          }
        }
      ],
      responses: {
        ...createResponse(200, 'Successfully delete User', {}),
        ...error400,
        ...error401,
        ...error403,
        ...error500
      }

    }
  },
}
