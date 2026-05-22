import infoqPreview from '@site/blog/assets/previews/infoq-article-2026.png';
import brightbasePreview from '@site/blog/assets/previews/brightbase-article-2026.png';
import article163Preview from '@site/blog/assets/previews/163-article-2026.png';

export interface ExternalArticle {
  title: string;
  url: string;
  description: string;
  date: string; // ISO 8601
  image?: string;
  category: 'announcements' | 'technology' | 'community';
  source: string;
}

const externalArticles: ExternalArticle[] = [
  {
    title: 'OpenChoreo 1.0 Brings AI Agents and GitOps to Kubernetes Developer Platforms',
    url: 'https://www.infoq.com/news/2026/04/openchoreo-10/',
    description:
      'OpenChoreo, the open-source internal developer platform built on Kubernetes, has shipped its 1.0 release and been accepted into the CNCF Sandbox. The project originated as the open-source counterpart to WSO2\'s commercial Choreo SaaS platform.',
    date: '2026-04-10',
    category: 'community',
    source: 'InfoQ',
    image: infoqPreview,
  },
  {
    title: 'OpenChoreo 1.0: A Game Changer for Kubernetes Platforms',
    url: 'https://bright-base.com/openchoreo-1-0-kubernetes-game-changer-oiczs',
    description:
      'The launch of OpenChoreo 1.0 is not just another software update; it represents a significant milestone in the evolution of developer platforms built on Kubernetes. This open-source internal developer platform has been officially accepted into the CNCF.',
    date: '2026-04-12',
    category: 'community',
    source: 'Bright Base',
    image: brightbasePreview,
  },
  {
    title: 'OpenChoreo 1.0 Released: Integrating AI Agents into the Kubernetes Development Layer (Translated)',
    url: 'https://www.163.com/dy/article/KRK6EB0T05561FZR.html',
    description:
      'A group of engineers spent three years breaking down the core capabilities of an enterprise-grade internal developer platform into open-source components. Now they\'ve officially delivered.',
    date: '2026-04-28',
    category: 'community',
    source: '163.com',
    image: article163Preview,
  },
];

export default externalArticles;
