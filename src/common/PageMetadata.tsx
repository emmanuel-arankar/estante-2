import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

interface PageMetadataProps {
  title: string;
  description: string;
  ogTitle?: string;
  ogDescription?: string;
  imageUrl?: string;
  noIndex?: boolean;
  schema?: object;
}

const SITE_URL = 'https://URL_DO_SEU_SITE';
const SITE_NAME = 'Estante de Bolso';
const DEFAULT_OG_IMAGE = `${SITE_URL}/logo-og.png`;

export const PageMetadata = ({ title, description, ogTitle, ogDescription, imageUrl, noIndex, schema }: PageMetadataProps) => { // # atualizado
  const location = useLocation();
  const canonicalUrl = `${SITE_URL}${location.pathname}`;

  const finalOgTitle = `${ogTitle || title} | ${SITE_NAME}`;
  const finalOgDescription = ogDescription || description;

  return (
    <Helmet>
      <title>{`${title} | ${SITE_NAME}`}</title>
      <meta name="description" content={description} />
      {noIndex && <meta name="robots" content="noindex, follow" />}
      <link rel="canonical" href={canonicalUrl} />
      
      <meta property="og:title" content={finalOgTitle} />
      <meta property="og:description" content={finalOgDescription} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:image" content={imageUrl || DEFAULT_OG_IMAGE} />
      <meta property="og:type" content="website" />
      
      <meta name="twitter:card" content="summary_large_image" />

      {/* # atualizado: Adiciona o script JSON-LD se a prop 'schema' for fornecida */}
      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      )}
    </Helmet>
  );
};