/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({ confirmationUrl }: InviteEmailProps) => (
  <Html lang="it" dir="ltr">
    <Head />
    <Preview>Il tuo accesso all'Area Riservata della Dott.ssa Annarita Lamanna</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Benvenuto/a nell'Area Riservata</Heading>
        <Text style={text}>
          Gentile collega,
        </Text>
        <Text style={text}>
          la Dott.ssa Annarita Lamanna ha attivato per te un account personale all'Area Riservata, dove troverai gli strumenti clinici e i materiali dei corsi a cui hai partecipato.
        </Text>
        <Text style={text}>
          Per completare l'attivazione e impostare la tua password, utilizza il pulsante qui sotto:
        </Text>
        <Button style={button} href={confirmationUrl}>
          Imposta la mia password
        </Button>
        <Text style={text}>
          Una volta impostata la password, potrai accedere in qualsiasi momento usando la tua email e la password scelta.
        </Text>
        <Text style={signature}>
          A presto,<br />
          Dott.ssa Annarita Lamanna
        </Text>
        <Text style={footer}>
          Se non riconosci questo invito, puoi semplicemente ignorare questa email: nessun account verrà attivato senza la tua conferma.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default InviteEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Raleway', Arial, sans-serif" }
const container = { padding: '32px 28px', maxWidth: '560px' }
const h1 = {
  fontFamily: "'Playfair Display', Georgia, serif",
  fontSize: '26px',
  fontWeight: '600' as const,
  color: 'hsl(178, 55%, 18%)',
  margin: '0 0 24px',
}
const text = {
  fontSize: '15px',
  color: 'hsl(180, 12%, 28%)',
  lineHeight: '1.6',
  margin: '0 0 16px',
}
const button = {
  backgroundColor: 'hsl(178, 55%, 18%)',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: '500' as const,
  borderRadius: '8px',
  padding: '14px 28px',
  textDecoration: 'none',
  display: 'inline-block',
  margin: '12px 0 24px',
}
const signature = {
  fontSize: '15px',
  color: 'hsl(180, 12%, 28%)',
  lineHeight: '1.6',
  margin: '24px 0 0',
  fontStyle: 'italic' as const,
}
const footer = { fontSize: '12px', color: 'hsl(180, 12%, 50%)', margin: '32px 0 0', lineHeight: '1.5' }
