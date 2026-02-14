"use client"
import { Box, Text } from '@zuzjs/ui';
import { AppStore, Store } from "@/store";
import createStore from "@zuzjs/store";
import React, { useEffect } from 'react'

const Dashboard : React.FC = (_props) => {

    useEffect(() => {
        document.title = `Dashboard`
    }, [])


    return <Box as={`flex h:100vh w:100vw`}>
        Dashboard        
    </Box>
}

export default Dashboard;