import { FaCalendar, FaClock, FaUser } from 'react-icons/fa';

import styles from './post-info.module.scss';

interface PostInfoProps {
  publicationDate: string;
  author: string;
  readEstimation?: number;
}

export function PostInfo({
  publicationDate,
  author,
  readEstimation,
}: PostInfoProps): JSX.Element {
  return (
    <div className={styles.info}>
      <div>
        <FaCalendar />
        <time>{publicationDate}</time>
      </div>
      <div>
        <FaUser />
        <span>{author}</span>
      </div>
      {readEstimation && (
        <div>
          <FaClock />
          <span>{readEstimation} min</span>
        </div>
      )}
    </div>
  );
}
