import { ApolloClient, InMemoryCache, HttpLink, ApolloLink } from '@apollo/client'

const AUTH_OPS      = ['Login', 'Register', 'Me']
const ANALYTICS_OPS = ['GetAnalytics', 'GetAITrendAnalysis', 'Chat']

const authLink = new ApolloLink((operation, forward) => {
  const token = localStorage.getItem('token')
  operation.setContext({ headers: { authorization: token ? `Bearer ${token}` : '' } })
  return forward(operation)
})

const routingLink = new ApolloLink((operation, forward) => {
  const name = operation.operationName || ''
  let uri = 'http://localhost:4002/graphql'         

  if (AUTH_OPS.includes(name))       uri = 'http://localhost:4001/graphql'
  else if (ANALYTICS_OPS.includes(name)) uri = 'http://localhost:4003/graphql'

  operation.setContext({ uri })
  return forward(operation)
})

const httpLink = new HttpLink({})

export const client = new ApolloClient({
  link: authLink.concat(routingLink).concat(httpLink),
  cache: new InMemoryCache(),
})
