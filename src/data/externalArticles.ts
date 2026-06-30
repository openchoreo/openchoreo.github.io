import infoqPreview from '@site/blog/assets/previews/infoq-article-2026.png';
import brightbasePreview from '@site/blog/assets/previews/brightbase-article-2026.png';
import zerotrustPreview from '@site/blog/assets/previews/zero-trust-2026.png';
import stackademicPreview from '@site/blog/assets/previews/stackademic-article.webp';
import article163Preview from '@site/blog/assets/previews/163-article-2026.png';
import condeintechnologyPreview from '@site/blog/assets/previews/codeintechnology-article-2026.jpg';
import bestidpitnextPreview from '@site/blog/assets/previews/bestidp-itnext-article-2026.webp';
import demistifyingAbdelPreview from '@site/blog/assets/previews/demystifying-abdel-article-2026.webp';
import inforworldPreview from '@site/blog/assets/previews/developer-platform-with-backstage-2026.webp';

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
    title:
      'OpenChoreo 1.0 Brings AI Agents and GitOps to Kubernetes Developer Platforms',
    url: 'https://www.infoq.com/news/2026/04/openchoreo-10/',
    description:
      "OpenChoreo, the open-source internal developer platform built on Kubernetes, has shipped its 1.0 release and been accepted into the CNCF Sandbox. The project originated as the open-source counterpart to WSO2's commercial Choreo SaaS platform.",
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
    title: 'Zero Trust Networking for OpenChoreo with Istio Ambient Mesh',
    url: 'https://nomadxd.github.io/blog/zero-trust-networking-for-openchoreo-with-istio-ambient-mesh',
    description:
      'How OpenChoreo Cell architecture and Istio ambient mesh create defense-in-depth for Kubernetes workloads, demonstrated with a simulated NASA Artemis II lunar mission.',
    date: '2026-04-14',
    category: 'community',
    source: 'Github',
    image: zerotrustPreview,
  },
  {
    title:
      'From Kubernetes to a Platform: A Guided Tour of OpenChoreo’s Custom Resources',
    url: 'https://blog.stackademic.com/from-kubernetes-to-a-platform-a-guided-tour-of-openchoreos-custom-resources-bfc4a88746ab',
    description:
      'A journey through OpenChoreo custom resource — what each one is for, why it exists, and how they all fit together to turn a raw Kubernetes cluster into a developer platform.',
    date: '2026-04-20',
    category: 'community',
    source: 'Stackademic',
    image: stackademicPreview,
  },
  {
    title:
      'OpenChoreo 1.0 Released: Integrating AI Agents into the Kubernetes Development Layer (Translated)',
    url: 'https://www.163.com/dy/article/KRK6EB0T05561FZR.html',
    description:
      "A group of engineers spent three years breaking down the core capabilities of an enterprise-grade internal developer platform into open-source components. Now they've officially delivered.",
    date: '2026-04-28',
    category: 'community',
    source: '163.com',
    image: article163Preview,
  },
  {
    title:
      'OpenChoreo 1.0: A CNCF-Accepted Kubernetes IDP with Native AI Agent Support and GitOps',
    url: 'https://www.codeintechnology.com/blog/openchoreo-1-0-kubernetes-idp-ai-agents-gitops-cncf',
    description:
      'OpenChoreo 1.0 is a CNCF Sandbox-accepted, open-source Kubernetes internal developer platform that brings native AI agent support via MCP servers, a built-in SRE agent, and GitOps through FluxCD — giving engineering teams a production-ready foundation without assembling the toolchain themselves.',
    date: '2026-04-29',
    category: 'community',
    source: 'codeintechnology.com',
    image: condeintechnologyPreview,
  },
  {
    title: 'The Best Internal Developer Platform Might Be the One Nobody Opens',
    url: 'https://medium.com/itnext/the-best-developer-platform-might-be-the-one-nobody-opens-7c55d322f348',
    description:
      'As AI agents increasingly become the primary interface for interacting with developer platforms, the best internal developer platform is one that stays invisible to developers but must still be built with the same rigor around self-service, governance, and continuous improvement.',
    date: '2026-06-09',
    category: 'community',
    source: 'itnext.io',
    image: bestidpitnextPreview,
  },
  {
    title: 'Demystifying OpenChoreo: An Architecture Overview',
    url: 'https://boredabdel.medium.com/demystifying-openchoreo-an-architecture-overview-5a6a14657f49',
    description:
      'A technical deep-dive into the OpenChoreo multi-plane, Kubernetes-native architecture and how this open-source internal developer platform simplifies platform engineering without hiding the underlying infrastructure.',
    date: '2026-06-18',
    category: 'community',
    source: 'Medium',
    image: demistifyingAbdelPreview,
  },
  {
    title: 'Building a state-of-the-art development platform with Backstage',
    url: 'https://www.infoworld.com/article/4189074/building-a-state-of-the-art-development-platform-with-backstage.html',
    description:
      'Why a developer portal isn’t a development platform, and how to design the all-important layer beneath it.',
    date: '2026-06-25',
    category: 'community',
    source: 'InfoWorld',
    image: inforworldPreview,
  },
];

export default externalArticles;
