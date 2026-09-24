export type User = {
  id: string;
  name: string;
  initials: string;
  accent: string;
};


export type ImageAttachment = {
  name: string;
  type: string;
  data: string;
};

export type ReplyReference = {
  messageId: string;
  authorName: string;
  text: string;
  imageName?: string;
};

export type Message = {
  id: string;
  author: User;
  text: string;
  time: string;
  deleted?: boolean;
  edited?: boolean;
  reactions?: Record<string, string[]>;
  image?: ImageAttachment;
  replyTo?: ReplyReference;
};

export type Room = {
  id: string;
  name: string;
  initials: string;
  accent: string;
  preview: string;
  time: string;
  participants: User[];
  messages: Message[];
};