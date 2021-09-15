import { GetStaticPathsResult, GetStaticPropsResult } from 'next';
import { useRouter } from 'next/router';
import Prismic from '@prismicio/client';
import PrismicDOM from 'prismic-dom';
import { RichText } from 'prismic-dom';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import { getPrismicClient } from '../../services/prismic';

import Header from '../../components/Header';
import { PostInfo } from '../../components/Post/Info';

import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  const router = useRouter();

  const readEstimation = post.data.content.reduce((prev, current) => {
    const content = PrismicDOM.RichText.asText(current.body);

    const words = content.split(' ');

    const result = Math.ceil(words.length / 200);

    return prev + result;
  }, 0);

  const publicationDate = format(
    new Date(post.first_publication_date),
    "dd MMM' 'yyyy",
    {
      locale: ptBR,
    }
  );

  if (router.isFallback) {
    return (
      <>
        <Header />
        <div>Carregando...</div>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className={styles.container}>
        <img src={post.data.banner.url} alt="" />
        <section>
          <h1>{post.data.title}</h1>
          <PostInfo
            publicationDate={publicationDate}
            author={post.data.author}
            readEstimation={readEstimation}
          />
        </section>
        {post.data.content.map(content => (
          <section className={styles.content} key={content.heading}>
            <h2>{content.heading}</h2>
            <div
              dangerouslySetInnerHTML={{
                __html: RichText.asHtml(content.body),
              }}
            />
          </section>
        ))}
      </main>
    </>
  );
}

export const getStaticPaths = async (): Promise<GetStaticPathsResult> => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    Prismic.predicates.at('document.type', 'posts'),
    {
      pageSize: 10,
      fetch: ['posts.uid'],
    }
  );

  const paths = posts.results.map(({ uid }) => ({
    params: {
      slug: uid,
    },
  }));

  return {
    paths,
    fallback: 'blocking',
  };
};

export async function getStaticProps({
  params,
}): Promise<GetStaticPropsResult<PostProps>> {
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', params.slug, {});

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    last_publication_date: response.last_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      author: response.data.author,
      banner: {
        url: response.data.banner.url,
      },
      content: response.data.content.map(content => {
        return {
          heading: content.heading,
          body: [...content.body],
        };
      }),
    },
  };
  return {
    props: {
      post,
    },
    revalidate: 1,
  };
}
