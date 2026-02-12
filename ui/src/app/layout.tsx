"use client"
import "@/app/css/app.scss";
import { setZuzMap, ThemeProvider, TRANSITION_CURVES, TRANSITIONS, Variant } from "@zuzjs/ui";
import Wrapper from "./wrapper";
import { withCredentials } from "@zuzjs/core"
import { zuzMap } from "./css/zuzmap";

withCredentials(true)
setZuzMap(zuzMap)

const RootLayout = ({ children, }: Readonly<{ children: React.ReactNode; }>) => {

  return (
    <html suppressHydrationWarning lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.zuzcdn.net" />
        <link rel="stylesheet" href="https://fonts.zuzcdn.net/public/AnQUNf8hK/style.css" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Google+Sans+Flex:opsz,wght@6..144,1..1000&display=swap" rel="stylesheet" />
      </head>
      <body>
        <ThemeProvider
          zuzMap={zuzMap}
          variant={Variant.Medium}
          dialog={{
            transition: TRANSITIONS.SlideInBottom,
            curve: TRANSITION_CURVES.Liquid,
          }}>
          <Wrapper>{children}</Wrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}

export default RootLayout