"use client"
import { Box, SPINNER, Spinner, Text } from '@zuzjs/ui';
import { AppStore, Store } from "@/store";
import createStore, { useStore } from "@zuzjs/store";
import React, { useMemo } from 'react'
import { useParams } from 'next/navigation';
import PageTitle from '../../page-title';

const Logs : React.FC = (_props) => {

    const { loading, error, users, list  } = useStore<typeof AppStore.Apps>(Store.Apps)
    const { app } = useParams()
    const [ appId, section ] = app

    return <Box as={`flex cols h:100vh w:calc[100vw - 330px] p:$page-padding overflow-y`}>
        <PageTitle 
            crumb={[
                { label: `Logs`, link: `/app/${appId}/logs`, icon: `book` }
            ]}
            />
        <Box as={`flex flex:1 rel`}>
            <Spinner type={SPINNER.Wave} as={`abs abc`} />
        </Box>
    </Box>
}

export default Logs;