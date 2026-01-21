"use client"
import { Box, Group, Icon, Spinner, SPINNER, Text, TRANSITION_CURVES, TRANSITIONS, useDelayed } from '@zuzjs/ui';
import React, { useEffect } from 'react';
import Modules from './modules';
import ModuleItem from './module_item';
import { useStore } from "@zuzjs/store"
import { AppStore, Store } from '@/store';
import Authenticate from '@/app/oauth';
import PageTitle from '../page-title';

const Page : React.FC = (_props) => {
    
    const { loading, ID, nm, ir } = useStore<typeof AppStore.User>(Store.User)

    useEffect(() => {
        window.document.title = `Hub`
    }, [loading])

    return <Box as={`w:100vw flex cols p:5vw,20vw`}>
        <PageTitle 
            crumb={[
                {
                    label: `Hub`,
                    icon: `colorfilter`
                }
            ]}
             />
        <Box as={[
            `grid grid-cols:repeat[5,1fr] grid-rows:repeat[5,1fr] gap:20`
        ]}>
        {
            loading || ID == -1 
                ? [...Array(5)].map( (_, i) => <ModuleItem 
                    key={`module-item-${i}-loader`} 
                    index={i+1} /> )
                : Modules.map( (m, i) => <ModuleItem 
                    key={`module-item-${i}-${m.name}`}
                    index={i+1} meta={m} /> )}
        </Box>
    </Box>
}

export default Page;