"use client"
import { Box, Button, Table, Text, useToast, useDrawer, useDialog } from '@zuzjs/ui';
import { AppStore, Store } from "@/store";
import createStore, { useStore } from "@zuzjs/store";
import React, { useEffect } from 'react'
import PageTitle from '../../page-title';
import { useParams } from 'next/navigation';
import { time, withPost } from '@zuzjs/core';
import { GitHubBranch } from '@/types';
import DeployBranch from './deploy-branch';

const SourceCode : React.FC = (_props) => {

    const { app } = useParams()
    const [ appId, section ] = app as Array<string>
    const { loading, deploying, branches, dispatch }  = useStore<typeof AppStore.Git>(Store.Git)
    const toast = useToast()
    const drawer = useDrawer()
    const dialog = useDialog()

    const loadData = () => {
        dispatch({ loading: true, deploying: false })
        withPost<{
            branches: GitHubBranch[]
        }>(`/_/git/branches`, {
            appId
        })
        .then(resp => {
            dispatch({ loading: false, deploying: false, branches: resp.branches })
        })
        .catch(err => {
            dispatch({ loading: false, deploying: false })
            toast.error(err.message)
        })
    }

    const deploy = (b: GitHubBranch) => {
        const dh = drawer.right(
            <DeployBranch
                appId={appId}
                branch={b}
                onClose={() => dialog.hide(dh)} />
        )
        // const dh = dialog.show({
        //     title: `Deploy Branch`,
        //     message: <DeployBranch
        //         appId={appId}
        //         branch={b}
        //         onClose={() => dialog.hide(dh)} />
        // });
    }

    useEffect(() => {
        loadData()
    }, [])

    return <Box as={`flex cols h:100vh w:calc[100vw - 330px] p:$page-padding overflow-y`}>
        <PageTitle
            crumb={[
                { label: `Source Code`, link: `/app/${appId}/source`, icon: `hashtag` }
            ]}
            />
        <Box as={`flex flex:1 rel`}>
            <Table
                loading={loading}
                loadingRowCount={5}
                animateRows={true}
                schema={[
                    {
                        id: `name`,
                        value: `Branch Name`,
                        render: (v) => <Box as={`flex cols gap:5`}>
                            <Text as={`s:lg bold`}>{v.name}</Text>
                            <Text as={`s:sm opacity:0.5`}>{v.sha}</Text>
                        </Box>
                    },
                    {
                        id: `modified`,
                        value: `Last Modified`,
                        maxW: 200,
                        render: (v, d) => <Text as={`s:sm`}>{time(v.lastUpdate, `lll`)}</Text>
                    },
                    {
                        id: `action`,
                        value: ``,
                        maxW: 150,
                        render: (v, d) => <Button onClick={() => deploy(v)}>Deploy</Button>
                    }
                ]}
                rows={branches} />
        </Box>
    </Box>
}

export default SourceCode;