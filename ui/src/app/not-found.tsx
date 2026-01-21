/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"
import React from 'react';
import Error from './error';

const Page : React.FC = (_props) => {
    return <Error code={404} message={[
        `We looked everywhere`,
        `under the couch, behind the server, even in the trash folder.`,
        `But nope, this page doesn’t exist.`
    ]} />
}

export default Page;