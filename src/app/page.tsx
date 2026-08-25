"use client"

import { JudicialBrainApp } from "@/components/judicial/judicial-brain-app"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import * as React from "react"

function makeClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 15_000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  })
}

export default function Home() {
  const [client] = React.useState(makeClient)
  return (
    <QueryClientProvider client={client}>
      <JudicialBrainApp />
    </QueryClientProvider>
  )
}
