"use client"
import { dynamic } from '@zuzjs/core';
import { Box, Button, Form, Input, Text, useToast, Variant } from '@zuzjs/ui';
import React from 'react';

const CreateApp : React.FC<{
    onSuccess: (resp: dynamic) => void;
}> = ({ onSuccess }) => {

    const toast = useToast()

    return <Form
        errors={{
            name: `App name is required`,
            domain: `App domain is required`
        }}
        onSuccess={onSuccess}
        onError={e => toast.error(e.message || `Failed to create app`)}
        action={`/_/apps/create`}
        as={`flex cols gap:4 w:300 p:10`}>

        <Text as={`s:14 bold`}>Name</Text>
        <Text as={`s:12 mb:5 opacity:0.5`}>Display name for your app</Text>
        <Input 
            autoFocus={true}
            placeholder={`App Name`} name={`name`}  required />

        <Text as={`s:14 bold mt:20`}>Domain</Text>
        <Text as={`s:12 mb:5 opacity:0.5`}>Domain for your app</Text>
        <Input 
            placeholder={`www.example.com`} name={`domain`}  required />

        <Button 
            type={`submit`} 
             
            as={`mt:30 w:160! bold`}>Continue</Button>

    </Form>
}

export default CreateApp;