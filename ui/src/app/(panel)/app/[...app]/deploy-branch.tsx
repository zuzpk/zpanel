"use client"
import { GitHubBranch } from '@/types';
import { Box, Button, Cover, Text, useToast, Variant } from '@zuzjs/ui';
import React from 'react';
import { useStore } from '@zuzjs/store';
import { AppStore, Store } from '@/store';
import { withPost } from '@zuzjs/core';
import ZuzTerminal from '../../terminal';

const DeployBranch : React.FC<{
    appId: string,
    branch: GitHubBranch,
    onClose: () => void
}> = ({
    appId,
    branch,
    onClose
}) => {

    // const { 
    //     loading, 
    //     deploying,
    //     error, 
    //     branches, commits,
    //     dispatch
    // } = useStore<typeof AppStore.Git>(Store.Git)
    const toast = useToast()

    const [ deploying, setDeploying ] = React.useState(false)

    const sendBranchForDeploy = async () => {

        setDeploying(true)
        withPost<{
            kind: string;
            message: string;
        }>(`/_/git/deploy`, {
            appId,
            branch
        })
        .then(resp => {
            toast.success(resp.message)
            setDeploying(false)
        })
        .catch(error => {
            toast.error(error.message || `Request was not processed...`)
            setDeploying(false)
        })

    }

    return <Box as={`flex cols h:100vh w:60vw`}>


        <Box as={`flex cols gap:5 p:50 rel flex:1`}>
            
            {/* <Cover when={deploying} /> */}
            
            <Text as={`s:xl bold mb:20`}>Deploy Branch</Text>

            <Text as={`s:15 bold`}>Confirm deployment?</Text>
            <Text as={`s:15 mt:10`}>Branch {branch.name}</Text>
            <Text as={`s:14 opacity:0.7 mb:30`}>{branch.sha}</Text>

            <Box as={`flex aic gap:10`}>
                <Button 
                    disabled={deploying}
                    onClick={sendBranchForDeploy}>Deploy</Button>
                <Button 
                    disabled={deploying}
                    onClick={onClose}>Cancel</Button>
            </Box>
        </Box>
        
        { deploying && <ZuzTerminal appId={appId} /> }

    </Box>
}

export default DeployBranch;