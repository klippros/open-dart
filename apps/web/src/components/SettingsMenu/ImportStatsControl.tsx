import { Box, Button, Text } from '@chakra-ui/react'
import { useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { useAuth } from '../../hooks/authContext'
import { listAllMyOnlineMatchSessions } from '../../lib/matchServer/api'
import { isOnlineMatchesEnabled } from '../../lib/matchServer/config'
import { importLocalExport } from '../../lib/storage/localExport'
import { AuthStatus } from '../../types/auth'

export const ImportStatsControl = () => {
  const inputRef = useRef<HTMLInputElement>(null)
  const { authStatus, user } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const isSignedIn = authStatus === AuthStatus.Authenticated && user !== null

  const loadBlockedOnlineMatchIds = async (): Promise<ReadonlySet<string>> => {
    if (!isSignedIn || !isOnlineMatchesEnabled) {
      return new Set()
    }

    const rows = await listAllMyOnlineMatchSessions(null)
    return new Set(rows.map((row) => row.id))
  }

  const readImportFile = async (file: File): Promise<void> => {
    try {
      const text = await file.text()
      let blockedOnlineMatchIds: ReadonlySet<string>

      try {
        blockedOnlineMatchIds = await loadBlockedOnlineMatchIds()
      } catch {
        setError('Could not check online matches before importing.')
        return
      }

      if (!importLocalExport(text, undefined, { blockedOnlineMatchIds })) {
        setError('That file could not be imported.')
        return
      }

      window.location.reload()
    } catch {
      setError('That file could not be imported.')
    }
  }

  const handleFile = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (file === undefined) {
      return
    }

    void readImportFile(file)
  }

  return (
    <Box>
      <Text fontSize="sm" fontWeight="medium" color="white">
        Import stats
      </Text>
      <Text fontSize="xs" color="whiteAlpha.600" lineHeight="1.4" mb={2}>
        Load games from a file you downloaded.
      </Text>
      <Button
        size="sm"
        variant="cta"
        onClick={() => {
          inputRef.current?.click()
        }}
      >
        Choose file
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept="application/json,.json"
        hidden
        aria-label="Import stats"
        onChange={handleFile}
      />
      {error !== null ? (
        <Text mt={2} fontSize="xs" color="red.300">
          {error}
        </Text>
      ) : null}
    </Box>
  )
}
