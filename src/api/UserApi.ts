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
                url: '/login',
                method: 'POST',
                body: JSON.stringify(payload)
            }),
            invalidatesTags: ["User"]
        })
    }),
});

export const {
    useGetUserQuery,
    useLoginMutation,

    useLazyGetUserQuery
} = userApi;