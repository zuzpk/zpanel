"use client"
import { LocalDB } from '@/config';
import { Store } from '@/store';
import { User } from '@/types';
import { withGet } from '@zuzjs/core';
import { useDB } from '@zuzjs/hooks';
import { useStore } from '@zuzjs/store';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import React, { useEffect } from 'react';

const Authenticate : React.FC<{
    redirect: boolean
}> = ({ redirect }) => {

    const { getByID } = useDB(LocalDB.You)
    const { dispatch } = useStore<User>(Store.User)
    const router = useRouter()
    const pathname = usePathname();
    const searchParams = useSearchParams();
    
    const oauth = async () => {

        const nextUrl = `${pathname}${
            searchParams.toString() ? `?${searchParams.toString()}` : ''
        }`;

        await dispatch({ loading: true })
        withGet<{
            kind: string,
            user: {
                nm: string,
                ir: boolean
            }
        }>(`/_/auth?_`)
            .then(resp => {
                dispatch({ loading: false, ...resp.user })
            })
            .catch(async err => {
                await dispatch({ loading: false, ID: -1, nm: `?`, ir: false });
                if ( redirect ) router.push(`/?_nxt=${nextUrl}`)
            })

    }

    useEffect(() => { oauth() }, [])

    return null
}

export default Authenticate;