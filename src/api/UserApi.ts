import {baseApi} from './baseApi';

export const userApi = baseApi.enhanceEndpoints({addTagTypes: ["User"]}).injectEndpoints({
    endpoints: (builder) => ({
        getUser: builder.query({
            query: () => ({
                url: '/self'
            }),
            providesTags: ["User"],
        }),
        login: builder.mutation({
            query: (payload) => ({
                url: '/token',
                method: 'POST',
                body: payload
            }),
            invalidatesTags: ["User"]
        }),
        changePassword: builder.mutation({
            query: (payload) => ({
                url: '/self/password',
                method: 'POST',
                body: payload
            }),
            invalidatesTags: ["User"]
        })
    }),
});

export const {
    useGetUserQuery,
    useLoginMutation,
    useChangePasswordMutation,

    useLazyGetUserQuery
} = userApi;