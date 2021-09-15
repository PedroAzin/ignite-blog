import { useState } from 'react';
import { GetStaticProps } from 'next';
import Link from 'next/link';
import Prismic from '@prismicio/client';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import { getPrismicClient } from '../services/prismic';

import { PostInfo } from '../components/Post/Info';
import Header from '../components/Header';

import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

function convertPostWithFormattedData(posts: Post[]): Post[] {
  return posts.map(post => {
    return {
      ...post,
      first_publication_date: format(
        new Date(post.first_publication_date),
        "dd MMM' 'yyyy",
        {
          locale: ptBR,
        }
      ),
    };
  });
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const { results, next_page } = postsPagination;
  const [posts, setPosts] = useState(convertPostWithFormattedData(results));
  const [nextPage, setNextPage] = useState(next_page);

  async function handleClick(): Promise<void> {
    const nextPosts = await fetch(next_page);

    const nextPostsJSON = await nextPosts.json();

    const newPostsFormatted = convertPostWithFormattedData(
      nextPostsJSON.results
    );

    setPosts([...posts, ...newPostsFormatted]);

    setNextPage(nextPostsJSON.nextPage);
  }

  return (
    <>
      <Header />
      <main className={styles.container}>
        <ul>
          {posts.map(post => (
            <li key={post.uid}>
              <Link href={`/post/${post.uid}`}>
                <a>
                  <div>
                    <h1>{post.data.title}</h1>
                    <p>{post.data.subtitle}</p>

                    <PostInfo
                      publicationDate={post?.first_publication_date}
                      author={post.data.author}
                    />
                  </div>
                </a>
              </Link>
            </li>
          ))}
        </ul>
        {nextPage && (
          <button type="button" onClick={handleClick}>
            Carregar mais posts
          </button>
        )}
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      pageSize: 20,
    }
  );

  const posts = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  return {
    props: {
      postsPagination: {
        results: posts,
        next_page: postsResponse.next_page,
      },
    },
  };
};
