// @ts-nocheck
import { createApi } from '@reduxjs/toolkit/query/react'

const foobar = 'foobar'

const plox = `
here is a template that mentions foobar
    foobar: builder.query<boolean, void>({
`

foobar.charAt(1)

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery,
  endpoints: (builder) => ({
    foobarSimilar: () => {},
    /* foobar */
    // foobar: builder.query<boolean, void>({
    foobar: builder.query<boolean, void>({ // CORRECT
      query: () => ({ url: '/whatever', timeout: 5000 }),
    }),
    foobar2: builder.query<boolean, void>({
      query: () => ({ url: '/whatever', timeout: 5000 }),
    }),
    ['foobar3']: builder.query<boolean, void>({
      query: () => ({ url: '/whatever', timeout: 5000 }),
    }),
    "foobar4": builder.query<boolean, void>({
      query: () => ({ url: '/whatever', timeout: 5000 }),
    }),
    // example when foobar is at the very start of the line:
foobar5: builder.query<boolean, void>({
      query: () => ({ url: '/whatever', timeout: 5000 }),
    }),
    // example with spaces after the name:
    foobar6     : builder.query<boolean, void>({
      query: () => ({ url: '/whatever', timeout: 5000 }),
    }),
    'foobar7'     : builder.query<boolean, void>({
      query: () => ({ url: '/whatever', timeout: 5000 }),
    }),
  }),
})

export const { useLazyFoobarQuery, useFoobarQuery, useFoobarMutation } = authApi
