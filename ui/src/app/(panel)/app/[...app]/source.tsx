"use client"
import Error from '@/app/error';
import { AppStore, Store } from "@/store";
import { GitHubBranch } from '@/types';
import { _, time, withPost } from '@zuzjs/core';
import { useStore } from "@zuzjs/store";
import { Box, Button, css, Table, Text, useDialog, useDrawer, useToast } from '@zuzjs/ui';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import React, { useEffect } from 'react';
import PageTitle from '../../page-title';
import DeployBranch from './deploy-branch';

const SourceCode : React.FC = (_props) => {

    const { app } = useParams()
    const { loading: appLoading, error, users, list  } = useStore<typeof AppStore.Apps>(Store.Apps)
    const [ appId, section ] = app as Array<string>
    const { loading, deploying, branches, dispatch }  = useStore<typeof AppStore.Git>(Store.Git)
    const toast = useToast()
    const drawer = useDrawer()
    const dialog = useDialog()
    const currentApp = list.find(l => l.id == appId)

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
                app={currentApp!}
                branch={b}
                onClose={() => dh.close()} />
        )
        // const dh = dialog.show({
        //     title: `Deploy Branch`,
        //     message: <DeployBranch
        //         appId={appId}
        //         branch={b}
        //         onClose={() => dialog.hide(dh)} />
        // });
    }

    const pushLocalToGit = async () => {
        
    }

    useEffect(() => {
        window.document.title = `Source Code`
        if ( currentApp){
            loadData()
        }
    }, [currentApp])

    return <Box as={`flex cols h:100vh w:calc[100vw - 330px] p:$page-padding overflow-y`}>
        <PageTitle
            crumb={[
                { label: `Source Code`, link: `/app/${appId}/source`, icon: `hashtag` }
            ]}
            />
        <Box as={`flex flex:1 rel cols`}>
            <Text as={`s:lg bold`}>Git repo url</Text>
            {_(currentApp?.git?.url ?? ``).isEmpty() ? 
                <Link href={`/app/${appId}/settings`} className={css(`s:md c:$primary tdn &hover(tdu)`)}>Add GitHub repository URL</Link>
            :   <Box as={`flex aic gap:10`}>
                    <Text as={`s:md`}>{currentApp?.git?.url}</Text>
                    <Link href={`/app/${appId}/settings`} className={css(`s:md c:$primary tdn &hover(tdu)`)}>Change</Link>
                </Box>}
            <Table
                as={`mt:20`}
                loading={loading}
                loadingRowCount={5}
                animateRows={true}
                emptyMessage={<Error 
                    code={`No branches found`}
                    title={`We couldn't find any branches in your repository.`}
                    message={[
                        `Please make sure your repository is valid and try again.`,
                        `If it is private repository, make sure you have added the correct pem key in app settings.`
                    ]}
                    action={{
                        label: `Push Local to Git`,
                        on: pushLocalToGit  
                    }}
                />}
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