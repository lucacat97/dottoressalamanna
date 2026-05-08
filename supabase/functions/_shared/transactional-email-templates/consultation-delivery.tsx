import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Studio Carella & Lamanna'

interface ConsultationDeliveryProps {
  professionalFirstName?: string
  professionalLastName?: string
  consultationType?: string // e.g. "Consulenza Clinica", "Consulenza Cefalometrica"
  consultationHtml?: string // pre-rendered HTML body of the consulenza
}

const ConsultationDeliveryEmail = ({
  professionalFirstName,
  professionalLastName,
  consultationType,
  consultationHtml,
}: ConsultationDeliveryProps) => {
  const greeting = professionalFirstName || professionalLastName
    ? `Gentile Dott./Dott.ssa ${[professionalFirstName, professionalLastName].filter(Boolean).join(' ')}`
    : 'Gentile collega'
  const title = consultationType || 'Consulenza sul caso'

  return (
    <Html lang="it" dir="ltr">
      <Head />
      <Preview>{title} — Metodo MILA</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>{title}</Heading>
          <Text style={text}>{greeting},</Text>
          <Text style={text}>
            in allegato a questa email trova la <strong>{title}</strong> elaborata secondo il
            Metodo MILA. Si tratta di un&apos;interpretazione di supporto al ragionamento clinico
            e <strong>non costituisce in alcun modo una diagnosi medica</strong>: la
            responsabilità diagnostica e terapeutica resta interamente in capo al professionista
            sanitario.
          </Text>

          {consultationHtml ? (
            <Section style={consultationBox}>
              <div
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{ __html: consultationHtml }}
              />
            </Section>
          ) : null}

          <Text style={text}>
            La consulenza è pensata come strumento di confronto e approfondimento. Per qualunque
            chiarimento o per discutere il caso, può rispondere direttamente a questa email.
          </Text>
          <Text style={footer}>Cordiali saluti,<br />{SITE_NAME}</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: ConsultationDeliveryEmail,
  subject: (data: Record<string, any>) => {
    const t = (data?.consultationType as string) || 'Consulenza sul caso'
    return `${t} — Metodo MILA`
  },
  displayName: 'Consegna consulenza al professionista',
  previewData: {
    professionalFirstName: 'Mario',
    professionalLastName: 'Rossi',
    consultationType: 'Consulenza Clinica',
    consultationHtml: '<p>Anteprima della consulenza generata dal Metodo MILA.</p>',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px 28px', maxWidth: '720px' }
const h1 = {
  fontSize: '22px', fontWeight: 'bold', color: '#2a6f6f',
  margin: '0 0 20px', fontFamily: 'Georgia, serif',
}
const text = { fontSize: '14px', color: '#222222', lineHeight: '1.6', margin: '0 0 16px' }
const consultationBox = {
  margin: '20px 0',
  padding: '20px 22px',
  backgroundColor: '#f7faf9',
  border: '1px solid #d9e6e4',
  borderRadius: '8px',
  fontSize: '13px',
  color: '#222222',
  lineHeight: '1.55',
}
const footer = { fontSize: '12px', color: '#666666', margin: '24px 0 0' }
