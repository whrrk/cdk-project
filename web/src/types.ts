export type Course = {
  courseId?: string;
  pk?: string;
  sk?: string;
  title?: string;
  description?: string;
  createdAt?: string;
  [key: string]: any;
};

export type Thread = {
  pk: string;
  sk: string;
  courseId: string;
  title: string;
  createdBy: string;
  createdAt: string;
  [key: string]: any;
};

export type Message = {
  pk: string;
  sk: string;
  body: string;
  postedBy: string;
  postedAt: string;
  [key: string]: any;
};

export type Video = {
  videoId: string;
  title: string;
  order?: number;
  duration?: number;
  url: string;
}
