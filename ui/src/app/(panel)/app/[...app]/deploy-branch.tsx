"use client"
import { GitAction, GitHubBranch, ZuzApp } from '@/types';
import { withPost } from '@zuzjs/core';
import { Alert, Box, Button, Input, Span, Text, useToast } from '@zuzjs/ui';
import React, { useRef } from 'react';
import ZuzTerminal from '../../terminal';

const enum DeployState {
    Idle = -1,
    Deploying = 0,
    Deployed = 1,
    Failed = 2
}

const DeployBranch : React.FC<{
    app: ZuzApp,
    mode?: GitAction,
    branch?: GitHubBranch,
    onClose: () => void
}> = ({
    app,
    mode = `deploy`,
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


    const commitMsg = useRef<HTMLInputElement>(null)
    const [ deploying, setDeploying ] = React.useState(false)
    const [ deployed, setDeployed ] = React.useState<DeployState>(DeployState.Idle)
    const [ message, setMessage ] = React.useState<string | null>(null)

    const sendBranchForDeploy = async () => {

        setDeploying(true)
        withPost<{
            kind: string;
            message: string;
        }>(`/_/git/${mode}`, {
            appId: app.id,
            branch
        }, 60000)
        .then(resp => {
            setMessage(resp.message)
            setDeployed(DeployState.Deployed)
        })
        .catch(error => {
            setDeployed(DeployState.Failed)
            setMessage(error.message || `Deployment failed...`)
        })

    }

    return <Box as={`flex cols h:100vh w:60vw`}>


        <Box as={`flex cols gap:5 p:50 rel flex:1`}>
            
            { deployed != DeployState.Idle && <Alert
                as={`mb:20`}
                type={deployed == DeployState.Deployed ? `success` : `error`}
                title={deployed == DeployState.Deployed ? `Deployment successful!` : `Deployment failed!`}
                message={deployed == DeployState.Deployed ? message : message} /> }

            <Text as={`s:xl bold`}>{app.name}</Text>
            <Text as={`s:lg mb:20`}>{mode == `deploy` ? `Deploy` : mode == `push` ? `Push to` : `Pull`} Branch</Text>

            <Text as={`s:15 bold`}>Confirm {mode == `deploy` ? `deployment` : mode == `push` ? `push` : `pull`}?</Text>

            <Text as={`s:15 mt:15`}>Target Directory</Text>
            <Text as={`s:16`}>{app.path}</Text>
            
            <Text as={`s:15 mt:15`}>Branch</Text>
            {branch ? <>
                <Text as={`s:16`}>{branch.name}</Text>
                <Text as={`s:14 opacity:0.7`}>{branch.sha}</Text>
            </> : <>
                <Text as={`s:14 c:$red-500`}>No branch found, {mode}ing to main</Text>
            </>}

            <Text as={`s:15 mt:15`}>Commit Message</Text>
            <Text as={`s:14 c:$gray-600`}>If empty, auto commit message (Timestamp <Span as={`bold`}>{new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')}</Span>) will be generated</Text>
            <Input ref={commitMsg} placeholder={`Message...`} />

            <Box as={`flex aic gap:10 mt:30`}>
                { deployed == DeployState.Idle && <Button 
                    disabled={deploying}
                    onClick={sendBranchForDeploy}>{mode == `deploy` ? `Deploy` : mode == `push` ? `Push` : `Pull`}</Button> }
                <Button 
                    disabled={deploying && deployed == DeployState.Idle}
                    onClick={onClose}>{ deployed == DeployState.Deployed ? `Close` : `Cancel`}</Button>
            </Box>
        </Box>
        
        { deploying && <ZuzTerminal appId={app.id} /> }

    </Box>
}

export default DeployBranch;