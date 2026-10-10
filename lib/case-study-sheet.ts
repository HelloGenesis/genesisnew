/**
 * GENESIS'S CORRECTIONS FROM THE CASE-STUDY SHEET ("Genesis case studies",
 * returned 9 Oct 2026). Generated from the sheet's "All case studies" tab:
 * every field Genesis filled in there replaces the same field on the site,
 * last, over the master copy and the 2026 write-ups. Card lines come from the
 * "Card copy:" notes, outside links from the Backlinks column (Drive folders
 * left out — those are where the footage lives, not where readers go).
 */
import type { Outcome } from "./case-study-2026";

export type StudyLink = { label: string; url: string };

export type SheetStudy = {
  headline?: string;
  campaign?: string;
  brand?: string;
  service?: string;
  industry?: string;
  keyword?: string;
  brief?: string[];
  approach?: string[];
  execution?: string[];
  executionNote?: string;
  results?: string[];
  takeaway?: string;
  outcome?: Outcome[];
  card?: string;
  /** What was delivered, where the sheet gives it as words rather than a figure. */
  highlights?: string[];
  links?: StudyLink[];
  /** Final copy from the sheet (11 Oct 2026): fields it leaves blank are cleared, not kept from the old draft. */
  final?: boolean;
  /** Read as Genesis wrote it (the written layout, no "generated using AI" note). */
  written?: boolean;
};

export const sheetStudies: Record<number, SheetStudy> = {
  "1": {
    "headline": "#JumpForHealth 2023: 60K+ Jumps, Six Prosthetic Legs Donated",
    "campaign": "#JumpForHealth 2023",
    "service": "Influencer marketing, creator strategy and social content",
    "industry": "Health insurance, wellness and BFSI",
    "keyword": "healthcare influencer marketing",
    "takeaway": "In the same two-day period, the campaign generated more than 800K overall views—demonstrating how a focused creator partnership and community participation could turn a simple social-media action into measurable impact.",
    "brand": "Aditya Birla Capital (Health Insurance)",
    "brief": [
      "#JumpForHealth 2023 was Aditya Birla Health Insurance’s social-impact campaign built around one simple action: for every 10,000 jumps collected, the brand would donate one prosthetic leg to someone in need."
    ],
    "approach": [
      "Genesis partnered with fitness influencer [Rashmi Rai](https://www.instagram.com/rashmiraiofficial/) to lead the campaign and turn the initiative into a creator-led community challenge. Rashmi completed 20,000 jumps and invited her Instagram audience to participate by posting [Instagram Reels](https://www.instagram.com/reels/CrTNygDoj10/) and Stories using **#ABHIxRashmi**"
    ],
    "execution": [
      "Within just two days, the challenge inspired 55 UGC participants, who collectively contributed more than 40,000 additional jumps. Together, Rashmi and the UGC community helped the campaign cross 60,000 jumps, resulting in the donation of six prosthetic legs."
    ],
    "results": [
      "60K+ jumps",
      "55 UGC participants",
      "6 prosthetic legs donated",
      "800K+ overall views",
      "54K+ likes",
      "2K+ comments",
      "2.6K+ shares",
      "Achieved within 2 days"
    ],
    "outcome": [
      {
        "value": "60K+",
        "label": "jumps"
      },
      {
        "value": "55",
        "label": "UGC participants"
      },
      {
        "value": "6",
        "label": "prosthetic legs donated"
      },
      {
        "value": "800K+",
        "label": "overall views"
      },
      {
        "value": "54K+",
        "label": "likes"
      },
      {
        "value": "2K+",
        "label": "comments"
      },
      {
        "value": "2.6K+",
        "label": "shares"
      },
      {
        "value": "2 days",
        "label": "campaign period"
      }
    ]
  },
  "2": {
    "headline": "Jump For Health 2024: Scaling the movement through UGC Creators",
    "campaign": "Jump For Health 2024",
    "service": "Influencer marketing, creator strategy and social content",
    "industry": "Health insurance and wellness",
    "keyword": "healthcare influencer marketing",
    "brand": "Aditya Birla Capital (Health Insurance)",
    "brief": [
      "Jump For Health is a challenge that invites people to jump for their health while supporting a social cause. The second consecutive campaign needed to move beyond a few anchor posts and feel like a movement appearing across many different feeds.",
      "Genesis used four lead creators to establish the idea, then expanded distribution through a large UGC network. The structure made the participation recognisable while giving each contributor room to show the challenge in a personal way through dance moves and fun social-first trends."
    ],
    "results": [
      "500K views",
      "30K likes",
      "30K+ jumps"
    ],
    "outcome": [
      {
        "value": "500K",
        "label": "views"
      },
      {
        "value": "30K",
        "label": "likes"
      },
      {
        "value": "30K+",
        "label": "jumps"
      }
    ]
  },
  "3": {
    "headline": "Activ One Product Launch: Behind the scenes with Vikrant Massey",
    "campaign": "Activ One Product Launch",
    "service": "Influencer marketing, creator strategy and social content",
    "industry": "Health insurance and wellness",
    "keyword": "healthcare influencer marketing",
    "brand": "Aditya Birla Capital (Health Insurance)",
    "brief": [
      "ABHI wanted audiences to see more than the finished campaign. Genesis shaped the behind-the-scenes material around Vikrant Massey's presence, the pace of the set and the commitment behind the work. Tight filming and editing turned production access into a standalone digital asset rather than a conventional making-of."
    ],
    "results": [
      "100K+ views",
      "2K+ likes",
      "200+ shares",
      "9:16 format"
    ],
    "outcome": [
      {
        "value": "100K+",
        "label": "views"
      },
      {
        "value": "2K+",
        "label": "likes"
      },
      {
        "value": "200+",
        "label": "shares"
      },
      {
        "value": "9:16",
        "label": "format"
      }
    ]
  },
  "4": {
    "headline": "#LetsFaceIt with Comedy, Skincare and Photography Creators",
    "campaign": "#LetsFaceIt",
    "service": "Influencer marketing, creator strategy and social content",
    "industry": "Health insurance and wellness",
    "keyword": "healthcare influencer marketing",
    "brand": "Aditya Birla Health Insurance",
    "brief": [
      "For World Heart Day 2024, Aditya Birla Health Insurance launched #LetsFaceIt to encourage people to pay attention to their heart health and try the Face Scan feature in the Activ Health App.",
      "Genesis partnered with comedy, skincare and photography influencers, shaping the message around the content their audiences already enjoyed. The creators tried the scan, shared their health scores and invited followers to take part. The campaign was also featured by Social Samosa, a publication covering advertising, marketing and social media."
    ],
    "results": [
      "1.6M+ views",
      "90K+ likes",
      "3K+ shares"
    ],
    "outcome": [
      {
        "value": "1.6M+",
        "label": "views"
      },
      {
        "value": "90K+",
        "label": "likes"
      },
      {
        "value": "3K+",
        "label": "shares"
      }
    ]
  },
  "5": {
    "headline": "ABHI YogaBAE: Yoga Awareness with Kamya Sidana",
    "campaign": "ABHI YogaBAE",
    "service": "Influencer marketing, creator strategy and social content",
    "industry": "Health insurance and wellness",
    "keyword": "healthcare influencer marketing",
    "executionNote": "The campaign linked short social teasers, detailed video guidance and expert-authored articles, giving audiences a clear next step across Instagram, YouTube and the Activ Living community website.",
    "takeaway": "YogaBAE shows how creator-led education can connect social discovery with deeper learning on a brand’s community website.",
    "brand": "Aditya Birla Health Insurance",
    "brief": [
      "Genesis partnered with yoga expert Kamya Sidana for ABHI’s #YogaBAE campaign around International Yoga Day, building awareness of yoga, its benefits and how to practise Surya Namaskar.",
      "An Instagram video teaser directed viewers to a detailed YouTube video, which then encouraged them to explore Aditya Birla Health Insurance’s Activ Living community website. Kamya also authored articles on Surya Namaskar and yoga for sleep, extending the guidance beyond video. The campaign created a clear journey from discovering yoga on social media to learning more through Activ Living’s wellness content, with the aim of driving traffic to the website."
    ],
    "approach": [
      "Genesis built a clear journey from awareness to deeper learning: Instagram teaser → YouTube video → Activ Living community articles.",
      "The Instagram teasers introduced the topics and invited audiences to watch the full YouTube videos. The longer videos offered practical yoga guidance and directed viewers to the Activ Living website, where Kamya’s articles continued the learning. Website traffic was the campaign’s central objective."
    ],
    "execution": [
      "Two Instagram video teasers directing audiences to YouTube",
      "Two YouTube videos providing detailed yoga guidance",
      "Calls to action directing viewers to Aditya Birla Health Insurance’s Activ Living community website",
      "Kamya-authored articles on Surya Namaskar and yoga for sleep"
    ],
    "results": [
      "100K+ views",
      "6K+ likes",
      "50+ shares"
    ],
    "outcome": [
      {
        "value": "100K+",
        "label": "views"
      },
      {
        "value": "6K+",
        "label": "likes"
      },
      {
        "value": "50+",
        "label": "shares"
      }
    ],
    "links": [
      {
        "label": "Instagram reel 1",
        "url": "https://www.instagram.com/abchealthinsurance/reels/"
      },
      {
        "label": "Instagram reel 2",
        "url": "https://www.instagram.com/reel/Ct55FL2hdOC/"
      },
      {
        "label": "YouTube video 1",
        "url": "https://www.youtube.com/watch?v=Di5ybOcTKEU"
      },
      {
        "label": "YouTube video 2",
        "url": "https://www.youtube.com/watch?v=nZZNjG2V88I"
      },
      {
        "label": "Surya Namaskar, on Aditya Birla Capital",
        "url": "https://www.adityabirlacapital.com/healthinsurance/active-together/2023/06/22/steps-of-surya-namaskar/"
      },
      {
        "label": "Yoga for Sleep, on Aditya Birla Capital",
        "url": "https://www.adityabirlacapital.com/healthinsurance/active-together/2023/06/23/yoga-for-sleep/"
      }
    ]
  },
  "6": {
    "headline": "ABHI #AllForHealth 2025: Everyday Health, Shared through Creators",
    "campaign": "ABHI All For Health",
    "service": "Influencer marketing, creator strategy and social content",
    "industry": "Health insurance and wellness",
    "keyword": "healthcare influencer marketing",
    "executionNote": "Four creator stories connected through one shared call to participate in #AllForHealth.",
    "takeaway": "Everyday activities and creator communities made the health message approachable and encouraged participation.",
    "brand": "Aditya Birla Health Insurance",
    "brief": [
      "Aditya Birla Health Insurance’s #AllForHealth campaign encouraged people to take action for their health, with a pledge to fund health education for one school for every 1,000 participants. Genesis collaborated with Bombay Running Club, basketball creator Mohit Rawat, yoga creator Aelin and cooking creator Vavya to show how everyday interests can become healthier habits. The running activation brought together over 200 people, turning the message into a shared community experience. Each reel used the creator’s own activity and familiar content style to make participation approachable, from preparing a healthy meal to practising yoga or playing basketball. Creator briefs, creative direction and production support connected these stories through one shared call to participate in #AllForHealth."
    ],
    "approach": [
      "Genesis used running, basketball, yoga and cooking to show how everyday interests can become healthier habits. Each creator’s activity and familiar content style made participation approachable."
    ],
    "execution": [
      "Bombay Running Club: running activation with 200+ participants",
      "Mohit Rawat: basketball reel",
      "Aelin: yoga reel",
      "Vavya: cooking reel",
      "Creator briefs, creative direction, approvals and production coordination"
    ],
    "results": [
      "397K+ views",
      "11.6K+ likes",
      "2K+ shares",
      "120+ comments",
      "200+ running participants",
      "4 creator collaborations"
    ],
    "outcome": [
      {
        "value": "397K+",
        "label": "views"
      },
      {
        "value": "11.6K+",
        "label": "likes"
      },
      {
        "value": "2K+",
        "label": "shares"
      },
      {
        "value": "120+",
        "label": "comments"
      },
      {
        "value": "200+",
        "label": "running participants"
      },
      {
        "value": "4",
        "label": "creator collaborations"
      }
    ],
    "card": "Genesis brought running, basketball, yoga and cooking into ABHI’s #AllForHealth campaign, inspiring healthier habits while supporting health education in schools.",
    "links": [
      {
        "label": "Instagram reel 1",
        "url": "https://www.instagram.com/p/DJ9LwEMvS57/"
      },
      {
        "label": "Instagram reel 2",
        "url": "https://www.instagram.com/reel/DLAIIixh4Qz/?mdxt=NmRhdm12a2J5OGhn"
      },
      {
        "label": "Instagram reel 3",
        "url": "https://www.instagram.com/p/DK4dxIOiTw8/"
      },
      {
        "label": "Instagram reel 4",
        "url": "https://www.instagram.com/p/DKR9rXqClsJ/"
      }
    ]
  },
  "7": {
    "headline": "ABHI: Getting to Know Health Insurance Terms with Mohin Khan",
    "campaign": "ABHI: Health Insurance Terms with Mohin Khan",
    "service": "Influencer marketing, creator strategy and social content",
    "industry": "Health insurance and wellness",
    "keyword": "health insurance terms with Mohin Khan",
    "executionNote": "The resulting reel gave insurance vocabulary a light, memorable introduction that felt natural on social feeds.",
    "takeaway": "Familiar wordplay made health insurance terminology more approachable and memorable.",
    "brand": "Aditya Birla Health Insurance",
    "brief": [
      "Aditya Birla Health Insurance wanted to make health insurance terminology more approachable through content people would enjoy watching. Genesis collaborated with comedy creator Mohin Khan, using his familiar wordplay and conversational humour to bring terms such as Beneficiary, Sum Insured, Policy Lapse and Dependent into a series of short jokes. The resulting reel gave insurance vocabulary a light, memorable introduction that felt natural on social feeds."
    ],
    "approach": [
      "Genesis collaborated with comedy creator Mohin Khan, using his familiar wordplay and conversational humour to bring insurance terminology into a series of short jokes."
    ],
    "execution": [
      "Beneficiary, Sum Insured, Policy Lapse and Dependent featured in one playful, pun-led collaborative Instagram reel."
    ],
    "results": [
      "120K+ views",
      "3K+ likes",
      "100+ comments",
      "1 collaborative reel"
    ],
    "outcome": [
      {
        "value": "120K+",
        "label": "views"
      },
      {
        "value": "3K+",
        "label": "likes"
      },
      {
        "value": "100+",
        "label": "comments"
      },
      {
        "value": "1",
        "label": "collaborative reel"
      }
    ],
    "card": "Genesis collaborated with comedy creator Mohin Khan to turn health insurance terminology into a playful, pun-led reel, earning 120K+ views.",
    "links": [
      {
        "label": "Instagram reel 1",
        "url": "https://www.instagram.com/p/DDE3Zveydwn/"
      }
    ]
  },
  "8": {
    "headline": "Mahindra Finance #ShubhUtsav: Driving Festive Loan Awareness with 120+ Creators",
    "campaign": "Mahindra Finance Shubh Utsav",
    "service": "UGC strategy, creator activation and campaign operations",
    "industry": "BFSI and financial services",
    "keyword": "UGC agency India",
    "brand": "Mahindra Finance",
    "brief": [
      "Mahindra Finance wanted to build festive-season awareness for its vehicle-loan offering. Genesis activated creators around #ShubhUtsav, a reward-based selfie contest that gave audiences a simple way to join the celebration. Creator videos introduced the challenge, encouraged participation and brought attention to the festive offer through content that felt familiar on their feeds. The chance to win rewards gave people an added reason to take part, while 130+ videos published within three days created a concentrated burst of visibility."
    ],
    "results": [
      "20M+ views",
      "700K+ likes",
      "120+ creators",
      "130+ live videos",
      "3 days"
    ],
    "outcome": [
      {
        "value": "20M+",
        "label": "views"
      },
      {
        "value": "700K+",
        "label": "likes"
      },
      {
        "value": "120+",
        "label": "creators"
      },
      {
        "value": "130+",
        "label": "live videos"
      },
      {
        "value": "3",
        "label": "days"
      }
    ],
    "card": "Genesis brought Mahindra Finance’s reward-based festive selfie contest to social feeds through 120+ creators, publishing 130+ videos in three days."
  },
  "9": {
    "headline": "The WorldGrad: Bringing Study-Abroad Ambitions Closer with Creator-Led Guidance",
    "campaign": "The WorldGrad",
    "service": "Influencer marketing, creator strategy and social content",
    "industry": "Education and study abroad",
    "keyword": "education influencer marketing campaign",
    "brand": "The WorldGrad",
    "brief": [
      "The WorldGrad, a study-abroad education provider offering pathways with international university partners, wanted to reach students exploring overseas education. Genesis partnered with education and travel creators who could speak credibly about studying, travelling and living abroad. Trend-aware content centred on the questions students actually ask, bringing practical guidance into familiar creator formats. Their perspectives made the study-abroad journey feel more relatable and gave students an accessible introduction to The WorldGrad’s offering."
    ],
    "results": [
      "25 creators",
      "500K+ reach",
      "50K+ engagements"
    ],
    "outcome": [
      {
        "value": "25",
        "label": "creators"
      },
      {
        "value": "500K+",
        "label": "reach"
      },
      {
        "value": "50K+",
        "label": "engagements"
      }
    ],
    "card": "Genesis partnered with 25 education and travel creators to turn real student questions into practical social content, reaching 500K+ people and generating 50K+ engagements."
  },
  "14": {
    "headline": "ABHI Mother’s Day 2024: Caring for the One Who Cares for Us",
    "campaign": "ABHI Mother’s Day 2024",
    "service": "Influencer marketing, creator strategy and social content",
    "industry": "Health insurance and wellness",
    "keyword": "Mother’s Day health insurance creator campaign",
    "executionNote": "The creator-led reel positioned health insurance as a meaningful expression of care, linking the Mother’s Day message to a clear invitation to explore the plan.",
    "takeaway": "A familiar family emotion connected the Mother’s Day occasion with a meaningful reason to consider health insurance.",
    "brand": "Aditya Birla Health Insurance",
    "brief": [
      "For Mother’s Day 2024, Aditya Birla Health Insurance wanted to connect Activ One VYTL with the care mothers give their families every day. Genesis collaborated with Gunika Sethi to bring a familiar emotion into the conversation: she has always looked after our health, and now it is our turn to look after hers. The creator-led reel positioned health insurance as a meaningful expression of care, linking the Mother’s Day message to a clear invitation to explore the plan."
    ],
    "approach": [
      "Genesis collaborated with lifestyle and mom creator Gunika Sethi to bring a familiar emotion into the conversation: she has always looked after our health, and now it is our turn to look after hers."
    ],
    "execution": [
      "One collaborative Instagram reel connecting Mother’s Day with caring for mothers’ health through Activ One VYTL."
    ],
    "results": [
      "45K+ views",
      "5K+ likes",
      "100+ shares",
      "1 collaborative reel"
    ],
    "outcome": [
      {
        "value": "45K+",
        "label": "views"
      },
      {
        "value": "5K+",
        "label": "likes"
      },
      {
        "value": "100+",
        "label": "shares"
      },
      {
        "value": "1",
        "label": "collaborative reel"
      }
    ],
    "card": "Genesis collaborated with lifestyle and mom creator Gunika Sethi to turn Mother’s Day into a reminder to protect mothers’ health with Activ One VYTL.",
    "links": [
      {
        "label": "ABHI Instagram profile",
        "url": "https://www.instagram.com/abchealthinsurance/"
      }
    ]
  },
  "15": {
    "headline": "Activ Yuva Product Launch: A repeatable AI Avatar Content System",
    "campaign": "Activ Yuva Product Launch",
    "service": "AI content production, avatar development and motion design",
    "industry": "Health insurance and wellness",
    "keyword": "AI avatar content",
    "brand": "Aditya Birla Health Insurance",
    "brief": [
      "Activ Yuva needed a recognisable content style for a youth focused, app led health insurance product. Genesis developed Adi and Diya, defined how they speak and built a repeatable production approach around them. Clear scripts, motion design and app visuals carried that style from the launch film into explainers for HealthReturns, maternity cover, OPD, Travel ON/OFF, Income Protect and Unlimited Sum Insured, as well as short feature introductions."
    ],
    "results": [
      "17M+ views",
      "2 AI avatars",
      "16:9 + 9:16 video formats"
    ],
    "outcome": [
      {
        "value": "17M+",
        "label": "views"
      },
      {
        "value": "2",
        "label": "AI avatars"
      },
      {
        "value": "16:9 + 9:16",
        "label": "video formats"
      }
    ]
  },
  "16": {
    "headline": "SINet: Bringing a Township Vision to Life with AI",
    "campaign": "SINet Seervi Township",
    "service": "AI video production and real-estate visualisation",
    "industry": "Real estate",
    "keyword": "AI real estate marketing",
    "executionNote": "Voiceover, motion graphics and editing shaped these sequences into a cohesive presentation built around the project’s community focus.",
    "takeaway": "An immersive visual narrative helped audiences picture the township vision before construction.",
    "brand": "SINet Seervi Township",
    "brief": [
      "SINet needed to communicate a township vision while the project was still at the proposal stage. Genesis AI Labs developed AI-generated environments and cinematic sequences that brought the concept to life. The story connected spaces with everyday community life, making the proposal easier to imagine. Voiceover, motion graphics and editing shaped these sequences into a cohesive presentation built around the project’s community focus."
    ],
    "approach": [
      "Genesis AI Labs developed AI-generated environments and cinematic sequences that brought the concept to life."
    ],
    "execution": [
      "The story connected spaces with everyday community life, making the proposal easier to imagine."
    ],
    "results": [
      "73 AI-generated clips",
      "1 township presentation video",
      "AI-led concept visualisation"
    ],
    "outcome": [
      {
        "value": "73",
        "label": "AI-generated clips"
      },
      {
        "value": "1",
        "label": "township presentation video"
      }
    ],
    "card": "Genesis AI Labs created an immersive visual world for SINet’s proposed township, helping audiences picture its vision before construction.",
    "highlights": [
      "AI-led concept visualisation"
    ]
  },
  "17": {
    "headline": "House of Hiranandani Maitri Park: Bringing Premium Living into Focus with AI",
    "campaign": "House of Hiranandani: Maitri Park",
    "service": "AI video production and real-estate visualisation",
    "industry": "Real estate",
    "keyword": "AI real estate marketing",
    "executionNote": "Clear project messaging and calls to enquire or book a site visit.",
    "takeaway": "Helping prospective buyers picture the life Maitri Park offers.",
    "brand": "House of Hiranandani",
    "brief": [
      "Promoting a premium residential development means helping prospective buyers picture the life it offers. For Genesis Estate’s marketing of House of Hiranandani’s Maitri Park in Chembur, Genesis AI Labs uses project imagery and layout references to develop AI-generated visuals and video sequences. The creative approach brings together architecture, landscaped spaces and lifestyle features in an aspirational narrative, supported by clear project messaging and calls to enquire or book a site visit."
    ],
    "approach": [
      "Genesis AI Labs uses project imagery and layout references to develop AI-generated visuals and video sequences."
    ],
    "execution": [
      "AI-generated property visuals",
      "Video + carousel content",
      "WhatsApp promotional creative"
    ],
    "results": [
      "AI-generated property visuals",
      "Video + carousel content",
      "WhatsApp promotional creative"
    ],
    "card": "Genesis AI Labs develops property visuals and content for Maitri Park, using AI to bring its architecture, amenities and residential experience into focus.",
    "highlights": [
      "AI-generated property visuals",
      "Video + carousel content",
      "WhatsApp promotional creative"
    ]
  },
  "18": {
    "headline": "Advocate Bharat: A Digital Presence for Legal Awareness",
    "campaign": "Advocate Bharat",
    "service": "AI content production, avatar development and motion design",
    "industry": "Legal education",
    "keyword": "AI avatar content",
    "executionNote": "A consistent face for exploring new topics and content formats.",
    "takeaway": "Building his personal brand identity in the legal-awareness space.",
    "brand": "Advocate Bharat",
    "brief": [
      "Legal information can feel difficult to follow when it comes through unfamiliar terms and lengthy explanations. Advocate Bharat’s digital avatar creates a recognisable presence for sharing legal-awareness content in a concise, approachable format.",
      "Genesis AI Labs brings together realistic visuals, a professional setting and carefully directed voice and lip-sync to shape his digital presence. The avatar provides a consistent face for exploring new topics and content formats, while building his personal brand identity in the legal-awareness space."
    ],
    "approach": [
      "A recognisable digital presence for concise, approachable legal-awareness content."
    ],
    "execution": [
      "Realistic visuals, a professional setting and carefully directed voice and lip-sync."
    ],
    "results": [
      "1 digital avatar",
      "Short-form legal-awareness content",
      "Recognisable professional identity"
    ],
    "outcome": [
      {
        "value": "1",
        "label": "digital avatar"
      }
    ],
    "card": "Genesis AI Labs develops Advocate Bharat’s digital avatar to bring his professional identity into short, accessible legal-awareness content.",
    "highlights": [
      "Short-form legal-awareness content",
      "Recognisable professional identity"
    ]
  },
  "19": {
    "headline": "Tanvi, Reimagined: Digital Avatar for Fashion Advertising",
    "campaign": "Tanvi, Reimagined",
    "service": "AI content production, avatar development and motion design",
    "industry": "Marketing and communications",
    "keyword": "AI avatar content",
    "brand": "Genesis Media",
    "brief": [
      "Fashion campaigns often begin with ideas that are difficult to produce in the real world. Tanvi uses a digital version of herself to test how one recognisable face can move through different styling, settings and visual directions.",
      "The avatar gives her space to try surreal campaign concepts, build fashion-led worlds and see how far an idea can go before committing to production with large scale teams. Each experiment begins with creative direction: the look, the mood and the story the image needs to tell. Through this work, she is building a strong personal brand identity in the fields of fashion, design & creative direction."
    ],
    "results": [
      "1 digital avatar",
      "Fashion-led visual experiments",
      "New campaign directions to develop further"
    ],
    "outcome": [
      {
        "value": "1",
        "label": "digital avatar"
      },
      {
        "value": "Fashion-led",
        "label": "visual experiments"
      },
      {
        "value": "New",
        "label": "campaign directions to develop further"
      }
    ]
  },
  "20": {
    "headline": "ABHI Manthan 2026: Celebrating 10 Years of ABHI with Event Videos",
    "campaign": "ABHI Manthan 2026: Power of 10 + Sales Pro",
    "service": "Video production, motion design and content adaptation",
    "industry": "Health insurance and wellness",
    "keyword": "BFSI video production",
    "executionNote": "Displayed on LED screens at Manthan 2026 for ABHI’s entire team.",
    "takeaway": "The event’s larger vision and everyday sales tools brought into one shared experience.",
    "brand": "Aditya Birla Health Insurance",
    "brief": [
      "Manthan 2026 brought Aditya Birla Health Insurance’s entire team together around the Power of 10, marking ten years of ABHI and setting the direction for its next chapter. Genesis Studios developed two complementary videos for the event’s LED screens: a powerful opening film and an introduction to the enhanced ABHI Sales Pro platform.",
      "The Power of 10 film combined motion graphics, animated typography, voiceover and music to connect ABHI’s health-first journey with its ambitions across people, profitability, purpose and customer lifetime value. The Sales Pro video brought a practical focus, pairing CDO Amit Jain’s message with clear visual explanations of lead management, activity planning, follow-ups, reminders and performance dashboards. Together, the videos brought the event’s larger vision and everyday sales tools into one shared experience."
    ],
    "approach": [
      "Two complementary videos for the event’s LED screens: a powerful opening film and an introduction to the enhanced ABHI Sales Pro platform."
    ],
    "execution": [
      "Motion graphics, animated typography, voiceover and music, alongside CDO Amit Jain’s message and clear platform explanations."
    ],
    "results": [
      "2 event videos",
      "LED-screen presentation",
      "Sales Pro platform walkthrough",
      "Power of 10 opening film"
    ],
    "outcome": [
      {
        "value": "2",
        "label": "event videos"
      }
    ],
    "card": "Genesis Studios created LED-screen videos for ABHI’s Manthan 2026, bringing its ten-year journey, growth ambitions and enhanced Sales Pro platform to life for the entire team.",
    "highlights": [
      "LED-screen presentation",
      "Sales Pro platform walkthrough",
      "Power of 10 opening film"
    ]
  },
  "21": {
    "headline": "TripGatee: Brand Identity, Design & Social Media",
    "campaign": "Brand Identity, Design & Social Media",
    "service": "Brand identity, social media content, profile revamp, event design and collaterals",
    "industry": "Luxury travel",
    "keyword": "luxury travel brand identity case study",
    "brand": "TripGatee",
    "brief": [
      "TripGatee is a travel brand offering bespoke holidays, luxury experiences and corporate travel services. Genesis develops its brand positioning, tone of voice and visual guidelines, bringing together colour, typography and logo usage across its communications.",
      "The work extends into an Instagram profile revamp, highlights, stories, static posts, carousels and reels that introduce the brand, its destinations and travel services. Content planning, scripts and captions carry the same visual style and brand voice across formats. Event-focused live stories connect its social presence with on-ground participation, while event booth design, brochures, visiting cards, letterheads and envelopes bring the identity into physical spaces."
    ],
    "results": [
      "Brand identity – positioning and visual guidelines",
      "Profile revamp – Instagram profile and highlights",
      "Social content – stories, static posts, carousels and reels",
      "Event coverage – live stories",
      "Event design – booth branding and collaterals",
      "Branded stationery – visiting cards, letterheads and envelopes"
    ],
    "outcome": [
      {
        "value": "Brand identity",
        "label": "positioning and visual guidelines"
      },
      {
        "value": "Profile revamp",
        "label": "Instagram profile and highlights"
      },
      {
        "value": "Social content",
        "label": "stories, static posts, carousels and reels"
      },
      {
        "value": "Event coverage",
        "label": "live stories"
      },
      {
        "value": "Event design",
        "label": "booth branding and collaterals"
      },
      {
        "value": "Branded stationery",
        "label": "visiting cards, letterheads and envelopes"
      }
    ],
    "card": "Genesis brings TripGatee’s travel offering to life through brand identity, social media content and event design, creating a consistent presence across digital and physical spaces."
  },
  "22": {
    "headline": "ABHI: Making Claims and Service Requests Easier with App Tour Videos",
    "campaign": "ABHI Claims & Service Requests",
    "service": "Video editing, app tours and digital navigation walkthroughs",
    "industry": "Health insurance and wellness",
    "keyword": "health insurance app navigation videos",
    "brand": "Aditya Birla Health Insurance",
    "brief": [
      "Aditya Birla Health Insurance needed to make its digital claims and service-request journeys easier for customers to follow. Genesis combined presenter footage, app and website screen recordings, and clear on-screen instructions to create step-by-step navigation videos in a mobile-friendly 9:16 format.",
      "The series covers tracking claims, responding to queries, finding network hospitals and raising cashless or reimbursement claims. App tours show customers where to tap, what details to enter and how to upload documents, with separate app-only and app-plus-website versions. A dedicated video also explains common submission mistakes, including missing documents, incorrect details and incomplete bills. The seventh video guides customers through raising a service request within the app."
    ],
    "results": [
      "7 – navigation videos",
      "9:16 – vertical format",
      "App tours – with step-by-step guidance",
      "App + website – claims walkthroughs"
    ],
    "outcome": [
      {
        "value": "7",
        "label": "navigation videos"
      },
      {
        "value": "9:16",
        "label": "vertical format"
      },
      {
        "value": "App tours",
        "label": "with step-by-step guidance"
      },
      {
        "value": "App + website",
        "label": "claims walkthroughs"
      }
    ],
    "card": "Genesis creates seven vertical navigation videos for ABHI, guiding customers through the Activ Health App and website to raise claims, track progress, respond to document requests and raise service requests."
  },
  "23": {
    "headline": "ABHI Women’s Day 2026: Celebrating Women’s Health through Customer Stories and Leadership",
    "campaign": "ABHI Women’s Day 2026",
    "service": "Video production, motion design and content adaptation",
    "industry": "Health insurance and wellness",
    "keyword": "video production agency Mumbai",
    "brand": "Aditya Birla Health Insurance",
    "brief": [
      "For Women’s Day 2026, Aditya Birla Health Insurance wanted to celebrate women taking charge of their health and recognise their contribution across the organisation. Genesis created two videos for customers and employees.",
      "The customer-focused reel brings together real women’s testimonials and health milestones, highlighting improvements through ABHI’s Health Coaching programme, HealthReturns earned and participation in wellness activities on the Activ Health App. Motion graphics make these achievements easy to follow, while subtitles and music connect the individual stories.",
      "The second video features Mayank Bathwal’s Women’s Day message to all employees, opening with “Her Power, हर तरफ.” Clear editing, on-screen text and music support a direct, personal message for internal distribution."
    ],
    "results": [
      "2 – Women’s Day videos",
      "Customer testimonials – health journeys and achievements",
      "CEO message – to all employees",
      "Motion graphics + subtitles – video edits"
    ],
    "outcome": [
      {
        "value": "2",
        "label": "Women’s Day videos"
      },
      {
        "value": "Customer testimonials",
        "label": "health journeys and achievements"
      },
      {
        "value": "CEO message",
        "label": "to all employees"
      },
      {
        "value": "Motion graphics + subtitles",
        "label": "video edits"
      }
    ],
    "card": "Genesis creates two videos for Aditya Birla Health Insurance on Women’s Day 2026: a reel highlighting women’s health journeys and achievements through customer testimonials and motion graphics, and Mayank Bathwal’s message to all employees."
  },
  "25": {
    "headline": "ABHI x HDFC: Celebrating a Decade of Partnership with Mr. Mayank Bathwal",
    "campaign": "ABHI x HDFC: Celebrating a Decade of Partnership with Mr. Mayank Bathwal",
    "service": "Leadership communications and video production",
    "industry": "Health insurance and wellness",
    "keyword": "BFSI video production",
    "brand": "Aditya Birla Health Insurance",
    "brief": [
      "Aditya Birla Health Insurance wanted to recognise HDFC’s Virtual Prime and Classic teams for their year-end performance and acknowledge a partnership spanning ten years. Genesis filmed Mr. Mayank Bathwal’s message, bringing his appreciation directly to the HDFC team.",
      "The video celebrates shared milestones, thanks the teams behind the progress and looks ahead to stronger customer engagement. A professionally lit talking-head shoot, supported by clear editing, subtitles and branded visuals, makes the message easy to follow and share internally."
    ],
    "results": [
      "1 leadership message",
      "16:9 video format",
      "Shoot + edit production",
      "HDFC teams internal communication"
    ],
    "outcome": [
      {
        "value": "1",
        "label": "leadership message"
      },
      {
        "value": "16:9",
        "label": "video format"
      }
    ],
    "card": "Genesis produces a video message from ABHI CEO Mr. Mayank Bathwal, recognising HDFC’s team achievements and celebrating ten years of partnership.",
    "highlights": [
      "Shoot + edit production",
      "HDFC teams internal communication"
    ]
  },
  "26": {
    "headline": "ABHI Fraud Awareness Week 2025: Building Awareness through Employee Voices",
    "campaign": "ABHI Fraud Awareness Week 2025: Building Awareness through Employee Voices",
    "service": "Employee vox-pop shoot, edit and delivery",
    "industry": "Health insurance and wellness",
    "keyword": "BFSI video production",
    "brand": "Aditya Birla Health Insurance",
    "brief": [
      "For Fraud Awareness Week 2025, Aditya Birla Health Insurance wanted to encourage employees to recognise fraud risks and take responsibility for preventing them. Under the theme “Together, Let’s Be the Firewall – Detect, Decode & Deter,” the video centres on a simple question: what comes to mind when you think about fraud?",
      "Genesis handles the shoot, edit and delivery, bringing employee responses together in a concise 9:16 video. The content covers workplace misconduct, phishing, digital scams and the everyday decisions that protect sensitive information. Familiar voices encourage viewers to pause, verify and report anything suspicious while reinforcing ABHI’s zero-tolerance approach to fraud."
    ],
    "results": [
      "1 employee vox-pop video",
      "9:16 vertical format",
      "Shoot + edit + delivery complete production"
    ],
    "outcome": [
      {
        "value": "1",
        "label": "employee vox-pop video"
      },
      {
        "value": "9:16",
        "label": "vertical format"
      }
    ],
    "card": "Genesis shoots, edits and delivers an employee vox-pop video for ABHI, turning fraud awareness into a relatable conversation about vigilance, integrity and customer trust.",
    "highlights": [
      "Shoot + edit + delivery complete production"
    ]
  },
  "27": {
    "headline": "ABHI Ka Star: Making Employee App Access Easy to Follow",
    "campaign": "ABHI Ka Star",
    "service": "Video production, motion design and content adaptation",
    "industry": "Health insurance and wellness",
    "keyword": "video production agency Mumbai",
    "brand": "Aditya Birla Health Insurance",
    "brief": [
      "ABHI Ka Star encouraged employees to explore the Activ Health App with free premium access and share feedback on their experience. Genesis turned the instructions into a playful, step-by-step video.",
      "It showed employees how to download the app, log in with their corporate account, switch from a personal account if needed and submit feedback, including screenshots. The film kept the practical steps clear while carrying the campaign’s “star” energy."
    ],
    "results": [
      "Complete app walkthrough",
      "9:16 motion graphics video"
    ],
    "outcome": [
      {
        "value": "Complete",
        "label": "app walkthrough"
      },
      {
        "value": "9:16",
        "label": "motion graphics video"
      }
    ]
  },
  "28": {
    "headline": "Dr Ameya Kanakiya on Menopause: Facts, Food and Real Talk",
    "campaign": "International Menopause Day 2025",
    "service": "Video production, motion design and content adaptation",
    "industry": "Health insurance and wellness",
    "keyword": "video production agency Mumbai",
    "brand": "Aditya Birla Health Insurance",
    "brief": [
      "Menopause is a natural stage of life when menstrual periods end. The transition can also bring changes to sleep, mood and physical wellbeing, yet many women receive too little information about what to expect.",
      "For World Menopause Day 2025, Activ Living wanted to open that conversation with credible, approachable guidance. Genesis built a three-video series with Dr Ameya Kanakiya: a fun 30-second reel rating internet advice to grab attention, a one-minute video on five foods to include during the menopause transition, and a five-minute main film offering a detailed menopause debrief."
    ],
    "results": [
      "1.2M+ views",
      "200+ shares",
      "3 videos",
      "9:16 format"
    ],
    "outcome": [
      {
        "value": "1.2M+",
        "label": "views"
      },
      {
        "value": "200+",
        "label": "shares"
      },
      {
        "value": "3",
        "label": "videos"
      },
      {
        "value": "9:16",
        "label": "format"
      }
    ]
  },
  "29": {
    "headline": "ABHI Activ Travel: Introducing Travel Insurance for Every Kind of Journey",
    "campaign": "ABHI Activ Travel: Introducing Travel Insurance for Every Kind of Journey",
    "service": "Video production, motion design and content adaptation",
    "industry": "Health insurance and wellness",
    "keyword": "video production agency Mumbai",
    "brand": "Aditya Birla Health Insurance",
    "brief": [
      "Aditya Birla Health Insurance needed to introduce Activ Travel and explain how its plans serve different international travellers. Genesis builds the content around familiar situations—from preparing for a family holiday to moving abroad for studies—connecting each journey with relevant insurance benefits.",
      "The main video introduces the offering, while five explainers cover the Student, Asia, Leisure, Senior and Annual Multi-Trip plans. Presenter-led storytelling, motion graphics and AI-generated travel visuals simplify features such as emergency medical care, travel disruptions, baggage loss, passport emergencies and global assistance. Genesis handles the shoot, editing and final delivery, maintaining a consistent visual style across all six videos."
    ],
    "results": [
      "6 completed videos",
      "1 main product video",
      "5 plan explainers",
      "Shoot + edit + delivery complete production",
      "Motion graphics + AI visuals visual storytelling"
    ],
    "outcome": [
      {
        "value": "6",
        "label": "completed videos"
      },
      {
        "value": "1",
        "label": "main product video"
      },
      {
        "value": "5",
        "label": "plan explainers"
      }
    ],
    "card": "Genesis brings ABHI’s Activ Travel offering to life through a main product video and five plan explainers, combining presenters, motion graphics and AI visuals to make travel insurance easier to understand.",
    "highlights": [
      "Shoot + edit + delivery complete production",
      "Motion graphics + AI visuals visual storytelling"
    ]
  },
  "30": {
    "headline": "Mpower Minds x ABHI: Expert Led Content Series",
    "campaign": "Mpower Minds x ABHI: Expert Led Content Series",
    "service": "Expert-led video shoot, edits and content adaptation",
    "industry": "Health insurance and wellness",
    "keyword": "video production agency Mumbai",
    "brand": "Aditya Birla Health Insurance",
    "brief": [
      "Aditya Birla Health Insurance collaborates with Mpower Minds, an initiative of the Aditya Birla Education Trust, to help audiences understand the connection between physical activity and mental wellbeing. Featuring psychologist Dr. Reet Patel, the content brings expert guidance into everyday situations, from taking a walk to managing stress at work.",
      "Genesis handles the shoot, using two camera angles, professional lighting and clear audio to capture her insights across four topics. The footage is organised by subject and camera angle, with edits delivered in 1:1, 9:16 and 16:9 to support different viewing formats."
    ],
    "results": [
      "4 expert-led topics",
      "2 camera angles",
      "1:1 + 9:16 + 16:9 video formats",
      "Shoot + edits + delivery — production support"
    ],
    "outcome": [
      {
        "value": "4",
        "label": "expert-led topics"
      },
      {
        "value": "2",
        "label": "camera angles"
      },
      {
        "value": "1:1 + 9:16 + 16:9",
        "label": "video formats"
      },
      {
        "value": "Shoot + edits + delivery",
        "label": "production support"
      }
    ],
    "card": "Genesis shoots with Dr. Reet Patel, a psychologist with Mpower Minds, for ABHI’s HLTH Meter, capturing practical conversations about walking, exercise, strength training and workplace stress, with edits delivered in three formats.",
    "final": true,
    "written": true
  },
  "31": {
    "headline": "ABHI: Bringing Health Messages to Social through Creator-Led Reels",
    "campaign": "ABHI: Bringing Health Messages to Social through Creator-Led Reels",
    "service": "Creator-led social reel production, shoot direction and editing",
    "industry": "Health insurance and wellness",
    "keyword": "video production agency Mumbai",
    "brand": "Aditya Birla Health Insurance",
    "brief": [
      "Aditya Birla Health Insurance wanted social content that could bring everyday health habits and insurance benefits into formats people already enjoy watching. Genesis adapts social trends into creator-led reels around walking, exercise, healthy choices, HealthReturns, customer appreciation and diabetes awareness.",
      "Genesis handles creator coordination, shoot planning, direction and editing. Group performances, lip-syncs, office scenarios and fashion transitions give each message its own expression, while on-screen copy connects the entertainment to ABHI’s offering. The work builds a varied library of short-form content for the brand’s social channels."
    ],
    "results": [
      "12 reels delivered across September and November 2024",
      "Creator-led short-form reels",
      "Trend-led humour, audio and transitions",
      "Health + insurance awareness",
      "Shoot + edit + delivery — complete production"
    ],
    "outcome": [
      {
        "value": "12",
        "label": "reels delivered across September and November 2024"
      },
      {
        "value": "Shoot + edit + delivery",
        "label": "complete production"
      }
    ],
    "highlights": [
      "Creator-led short-form reels",
      "Trend-led humour, audio and transitions",
      "Health + insurance awareness"
    ],
    "card": "Genesis creates short-form reels for Aditya Birla Health Insurance, using creators, trending audio, humour and playful transitions to make health and insurance messages feel familiar across social feeds.",
    "final": true,
    "written": true
  },
  "32": {
    "headline": "ABHI: A Simple Guide to DHA Face Scan on the Activ Health App",
    "campaign": "ABHI: A Simple Guide to DHA Face Scan on the Activ Health App",
    "service": "Presenter-led video shoot, editing and app walkthrough",
    "industry": "Health insurance and wellness",
    "keyword": "video production agency Mumbai",
    "brand": "Aditya Birla Health Insurance",
    "brief": [
      "Aditya Birla Health Insurance needed an easy-to-follow introduction to the Digital Health Assessment, or DHA, feature in the Activ Health App. The video explains the health insights shown in its report, including blood pressure, body mass, SpO₂ (blood oxygen saturation), respiration rate, stress index and heart rate.",
      "Genesis handles the shoot, edit and delivery, bringing presenter-led explanations together with app screen recordings and on-screen instructions. The walkthrough guides viewers from logging in and selecting the DHA tile to answering basic health questions, completing the face scan and viewing their report. Practical cues, such as finding good lighting and holding still during the scan, make the process easier to follow."
    ],
    "results": [
      "1 presenter-led explainer",
      "9:16 vertical video",
      "Step-by-step app walkthrough",
      "Shoot + edit + delivery — complete production"
    ],
    "outcome": [
      {
        "value": "1",
        "label": "presenter-led explainer"
      },
      {
        "value": "9:16",
        "label": "vertical video"
      },
      {
        "value": "Shoot + edit + delivery",
        "label": "complete production"
      }
    ],
    "highlights": [
      "Step-by-step app walkthrough"
    ],
    "card": "Genesis shoots and edits a presenter-led video for Aditya Birla Health Insurance, combining clear explanations and app visuals to introduce the DHA face scan and guide users through the assessment.",
    "final": true,
    "written": true
  },
  "33": {
    "headline": "ABHI: Introducing Activ Yuva’s Seven Features through Motion Graphics",
    "campaign": "ABHI: Introducing Activ Yuva’s Seven Features through Motion Graphics",
    "service": "Motion graphics, animation and feature-introduction videos",
    "industry": "Health insurance and wellness",
    "keyword": "BFSI video production",
    "brand": "Aditya Birla Health Insurance",
    "brief": [
      "Aditya Birla Health Insurance needed a youthful visual style to introduce the features of its new product, Activ Yuva. Genesis develops seven short videos covering Eat. Move. Heal. and HealthReturns, Unlimited Sum Insured, Travel ON/OFF, Worldwide Maternity Cover, OPD Cover, Yuva Reload 11x and Income Protect.",
      "Motion design, animated typography and app-inspired visuals give each feature a distinct introduction while keeping the series visually consistent. Clear messaging makes insurance terminology easier to follow, building a feature library that supports the product launch and ongoing communication."
    ],
    "results": [
      "7 feature-introduction videos",
      "9:16 vertical format",
      "Motion graphics animation and typography",
      "One consistent visual style"
    ],
    "outcome": [
      {
        "value": "7",
        "label": "feature-introduction videos"
      },
      {
        "value": "9:16",
        "label": "vertical format"
      }
    ],
    "highlights": [
      "Motion graphics animation and typography",
      "One consistent visual style"
    ],
    "card": "Genesis creates seven motion graphics videos for ABHI’s new health insurance product, Activ Yuva, using playful visuals and clear messaging to introduce its features.",
    "final": true,
    "written": true
  },
  "35": {
    "headline": "Mahindra Finance Founders’ Day 2025: Capturing the Celebration",
    "campaign": "Mahindra Finance Founders’ Day 2025: Capturing the Celebration",
    "service": "Event content production and social-first editing",
    "industry": "BFSI and financial services",
    "keyword": "event content production",
    "brand": "Mahindra Finance",
    "brief": [
      "Mahindra Finance wanted to capture its Founders’ Day celebration and turn the occasion into a concise video. The content needed to carry the atmosphere of the event while making its highlights easy to watch and share.",
      "Genesis handles the on-ground shoot, edit and delivery, shaping the event footage into a short 9:16 video. The vertical format brings the celebration beyond the venue, giving the brand a visual record of the day for its digital communications."
    ],
    "results": [
      "1 event highlight video",
      "9:16 vertical format",
      "Shoot + edit + delivery — complete production"
    ],
    "outcome": [
      {
        "value": "1",
        "label": "event highlight video"
      },
      {
        "value": "9:16",
        "label": "vertical format"
      },
      {
        "value": "Shoot + edit + delivery",
        "label": "complete production"
      }
    ],
    "card": "Genesis shoots, edits and delivers a short event highlight video for Mahindra Finance’s Founders’ Day 2025, bringing the celebration into a format designed for social sharing.",
    "final": true,
    "written": true
  },
  "36": {
    "headline": "ABHI Utsav Milestone 2025: Capturing the People behind the Celebration",
    "campaign": "ABHI Utsav Milestone 2025: Capturing the People behind the Celebration",
    "service": "Event content production and social-first editing",
    "industry": "Health insurance and wellness",
    "keyword": "event content production",
    "brand": "Aditya Birla Health Insurance",
    "brief": [
      "Aditya Birla Health Insurance wanted to capture its Utsav Milestone celebration through content that reflected both the occasion and the people who brought it to life. The coverage brings together preparations, leadership conversations, employee stories, awards and celebrations.",
      "Genesis handles the event shoot, photography, editing and delivery, bringing behind-the-scenes moments and the main event together through distinct video edits. Moments with Mr. Mayank Bathwal and Mrs. Vishakha Mulye sit alongside candid interactions, audience reactions and stage highlights. Edited photographs extend the coverage into a visual library for the brand’s communications."
    ],
    "results": [
      "2 event video edits — BTS and aftermovie",
      "9:16 vertical video format",
      "Event photography — candid and edited images",
      "Shoot + edit + delivery — complete production"
    ],
    "outcome": [
      {
        "value": "2 event video edits",
        "label": "BTS and aftermovie"
      },
      {
        "value": "9:16",
        "label": "vertical video format"
      },
      {
        "value": "Event photography",
        "label": "candid and edited images"
      },
      {
        "value": "Shoot + edit + delivery",
        "label": "complete production"
      }
    ],
    "card": "Genesis shoots and edits event videos and photographs for Aditya Birla Health Insurance’s Utsav Milestone 2025, capturing leadership moments, employee participation and the energy of the celebration.",
    "final": true,
    "written": true
  },
  "37": {
    "headline": "HDFC Bank x ABHI: Making Policy Benefits Easy to Understand",
    "campaign": "HDFC Bank x ABHI",
    "service": "Policy explainer videos, motion graphics and digital animation",
    "industry": "Health insurance and wellness",
    "keyword": "HDFC Bank policy explainer videos",
    "brand": "HDFC Bank and Aditya Birla Health Insurance",
    "brief": [
      "HDFC Bank x Aditya Birla Health Insurance needed quick, easy-to-understand videos for wide internal distribution. Genesis develops two 9:16 explainers, turning detailed product information into clear visual stories through animated cutouts, motion graphics and concise on-screen text.",
      "The Sampoorna 2.0 video builds on “Precaution is better than cure,” explaining everyday OPD benefits such as doctor consultations, diagnostic tests and medicines alongside hospitalisation, day-care treatments and AYUSH coverage. The second video introduces three protection combos for HDFC Salary Account holders—Elder Care Companion, ActiveLife Care and Super Shield Plus—covering elder assistance, teleconsultations, preventive check-ups, medical protection and personal accident cover."
    ],
    "approach": [
      "Animated cutouts, playful animation, motion graphics and concise on-screen text simplify product benefits."
    ],
    "execution": [
      "Sampoorna 2.0 policy explainer",
      "HDFC Salary Account Protection Combos explainer",
      "9:16 vertical videos for wide internal distribution"
    ],
    "executionNote": "Two distinct explainers; the salary-account video also has an adaptation without the HDFC slide.",
    "results": [
      "2 policy explainer videos",
      "9:16 vertical format",
      "Motion graphics – visual-led explanations",
      "Internal distribution – easy-to-share content"
    ],
    "takeaway": "Short visual explanations make detailed policy benefits easier to understand and share internally.",
    "outcome": [
      {
        "value": "2",
        "label": "policy explainer videos"
      },
      {
        "value": "9:16",
        "label": "vertical format"
      },
      {
        "value": "Motion graphics",
        "label": "visual-led explanations"
      },
      {
        "value": "Internal distribution",
        "label": "easy-to-share content"
      }
    ],
    "card": "Genesis creates two short, visual-led policy explainers for HDFC Bank x Aditya Birla Health Insurance, simplifying benefits through playful animation and clear motion graphics.",
    "final": true,
    "written": true
  },
  "38": {
    "headline": "ABHI Activ One: Capturing the Product Launch Event",
    "campaign": "Unveiling Activ One",
    "service": "Event content production and social-first editing",
    "industry": "Health insurance and wellness",
    "keyword": "event content production",
    "brand": "Aditya Birla Health Insurance",
    "brief": [
      "Aditya Birla Health Insurance wanted to capture the launch of Activ One through a video that conveyed the excitement of the occasion and the brand’s identity. The content needed to give viewers a clear sense of the event while keeping the product launch at its centre.",
      "Genesis handles the shoot, edit and delivery, shaping the event coverage into a high-energy 9:16 aftermovie. Creative camera work and well-paced editing bring the key moments together, giving ABHI a concise recap to share beyond the event."
    ],
    "approach": [
      "Creative camera work and well-paced editing bring the event’s key moments together while keeping the product launch at its centre."
    ],
    "execution": [
      "Event shoot",
      "Editing and delivery of one product launch aftermovie",
      "9:16 vertical format"
    ],
    "results": [
      "1 product launch aftermovie",
      "9:16 vertical format",
      "Event highlights – captured and edited",
      "Shoot + edit + delivery – complete production"
    ],
    "takeaway": "A concise event recap carries the launch’s energy beyond the occasion.",
    "outcome": [
      {
        "value": "1",
        "label": "product launch aftermovie"
      },
      {
        "value": "9:16",
        "label": "vertical format"
      },
      {
        "value": "Event highlights",
        "label": "captured and edited"
      },
      {
        "value": "Shoot + edit + delivery",
        "label": "complete production"
      }
    ],
    "card": "Genesis shoots and edits an event aftermovie for Aditya Birla Health Insurance’s Activ One launch, bringing the occasion’s energy and key highlights into one engaging video.",
    "final": true,
    "written": true,
    "links": [
      {
        "label": "Instagram reel",
        "url": "https://www.instagram.com/reel/C0mABAJBNCQ/"
      }
    ]
  },
  "39": {
    "headline": "ABHI UMANG 2024: Capturing the Energy of Go Active Fest",
    "campaign": "UMANG 2024",
    "service": "Event content production and social-first editing",
    "industry": "Health insurance and wellness",
    "keyword": "event content production",
    "brand": "Aditya Birla Health Insurance",
    "brief": [
      "Aditya Birla Health Insurance’s UMANG Go Active Fest brings health, participation and company culture together through five activity zones. The Unplug Zone features open mic performances and mandala art; the Mindful Zone offers posture training and sound baths; the Active Zone combines silent Bhangra Zumba and playlist yoga; the Nourish Zone explores skincare and herbal masks; and the Good Food Zone features pedal-powered juicing.",
      "Genesis handles the shoot, edit and delivery, capturing the experience through on-ground coverage, drone footage and candid photography. The 29-video library includes event walkthroughs, individual zone highlights, Vikrant Massey’s fireside chat and Mr. Mayank Bathwal’s address. Longer sessions become focused short edits covering teams, products and business priorities, with landscape and vertical adaptations extending the event’s content into internal communications."
    ],
    "results": [
      "29 videos delivered",
      "5 activity zones covered",
      "16:9 + 9:16 video formats",
      "Event + leadership video content",
      "Photography: event moments and candid coverage",
      "Shoot + edit + delivery: complete production"
    ],
    "outcome": [
      {
        "value": "29",
        "label": "videos delivered"
      },
      {
        "value": "5",
        "label": "activity zones covered"
      },
      {
        "value": "16:9 + 9:16",
        "label": "video formats"
      },
      {
        "value": "Photography",
        "label": "event moments and candid coverage"
      },
      {
        "value": "Shoot + edit + delivery",
        "label": "complete production"
      }
    ],
    "highlights": [
      "Event + leadership video content"
    ],
    "card": "Genesis captures ABHI’s UMANG 2024 through event coverage, leadership conversations and photography, delivering 29 videos across landscape and vertical formats.",
    "final": true,
    "written": true,
    "links": [
      {
        "label": "YouTube video",
        "url": "https://www.youtube.com/watch?v=Nms4xLrnhQk"
      }
    ]
  },
  "40": {
    "headline": "ABHI Power of Ten: Celebrating 10 Years through Leadership Voices",
    "campaign": "Manthan: Power of Ten",
    "service": "Leadership video production: shoot, edit and delivery",
    "industry": "Health insurance and wellness",
    "keyword": "leadership video production",
    "brand": "Aditya Birla Health Insurance",
    "brief": [
      "To mark ten years of Aditya Birla Health Insurance, ABHI brings its leadership voices together to reflect on the company’s journey and ambitions for the future. Created for Manthan, the video connects perspectives on health-first insurance, customer experience, partnerships, digital innovation and the people behind the business.",
      "Genesis handles the shoot across two locations in December 2025, followed by editing and delivery. Consistent framing, lighting and sound bring the individual leadership segments into one cohesive narrative, supported by on-screen names, designations and key messages. The finished video presents a shared story of ABHI’s progress and direction through the people helping shape it."
    ],
    "results": [
      "2 shoot locations",
      "16:9 video format",
      "Leadership voices: ExCom perspectives",
      "Shoot + edit + delivery: complete production"
    ],
    "outcome": [
      {
        "value": "2",
        "label": "shoot locations"
      },
      {
        "value": "16:9",
        "label": "video format"
      },
      {
        "value": "Leadership voices",
        "label": "ExCom perspectives"
      },
      {
        "value": "Shoot + edit + delivery",
        "label": "complete production"
      }
    ],
    "card": "Genesis shoots with ABHI’s senior leadership across two locations, bringing their perspectives together in a video celebrating ten years of Aditya Birla Health Insurance for Manthan.",
    "final": true,
    "written": true
  },
  "41": {
    "headline": "ABHI Activ Health App: Refreshing the Logo for a Digital Health Experience",
    "campaign": "Activ Health App Logo",
    "service": "Logo icon revamp and concept exploration",
    "industry": "Health insurance and wellness",
    "keyword": "app icon logo redesign case study",
    "brand": "Aditya Birla Health Insurance",
    "brief": [
      "Aditya Birla Health Insurance’s Activ Health App needs a contemporary identity that stays recognisable and works clearly on mobile screens. Genesis develops the logo refresh around simplicity, brand continuity and the app’s focus on proactive wellbeing, retaining its red and yellow colours.",
      "The creative approach explores a boomerang-inspired form with subtle heart cues integrated through geometry and negative space. Refinements to angle, thickness, curves and edges develop distinct directions while keeping the icon clear at small sizes. The work brings together visual research, hand sketches, form exploration and colour refinement, supported by app mockups, logo presentations and editable artwork."
    ],
    "results": [
      "Logo refresh — refined design directions",
      "App icon — mobile-focused visual development",
      "Red + yellow — brand continuity",
      "Editable artwork — Illustrator and PDF files"
    ],
    "outcome": [
      {
        "value": "Logo refresh",
        "label": "refined design directions"
      },
      {
        "value": "App icon",
        "label": "mobile-focused visual development"
      },
      {
        "value": "Red + yellow",
        "label": "brand continuity"
      },
      {
        "value": "Editable artwork",
        "label": "Illustrator and PDF files"
      }
    ],
    "card": "Genesis refreshes the Activ Health App’s visual identity through logo and app-icon explorations, bringing a clearer expression of health and wellbeing to a familiar brand.",
    "final": true,
    "written": true
  }
};

/** Studies the sheet merged into another: their number, and the study that now carries them. */
export const mergedStudies: Record<number, number> = {"34": 33, "42": 21};

const still = (name: string) => `/work/stills/${name}.jpg`;

/**
 * THE FOOTAGE THE SHEET POINTS AT, in the order of its video numbers. The
 * Backlinks column names Drive folders and numbered videos; each was brought
 * in as a preview and poster (public/work/clips, manifest.json) so the study
 * plays its own films, the first one leading. Stills are the design pieces and
 * photos from the same folders, PDFs shown by their first page.
 */
export const sheetMedia: Record<number, { films?: string[]; gallery?: string[] }> = {
  16: { films: ["30-sinet-ailabs-1"] },
  17: { films: ["31-houseofhiranandani-ailab-1"] },
  18: {
    films: ["32-adv-bharat-ailab-1"],
    gallery: ["33-adv-bharat-2", "34-adv-bharat-3", "35-adv-bharat-4", "36-adv-bharat-5"].map(still),
  },
  20: { films: ["37-manthan-2026-power-of-10", "38-sales-pro-power-of-10"] },
  21: {
    films: ["39-tripgatee-brand-design-1", "40-tripgatee-brand-design-2", "41-tripgatee-brand-design-3"],
    gallery: Array.from({ length: 13 }, (_, i) => still(`${42 + i}-tripgatee-${4 + i}`)),
  },
  22: {
    films: [
      "claims-1-how-to-track-claims",
      "claims-2-submit-queries-for-ongoing-claims",
      "claims-3-understanding-network-hospitals",
      "claims-4-how-to-raise-a-claim-app",
      "claims-5-raise-a-claim-app-and-website",
      "claims-6-common-mistakes",
      "claims-7-raise-a-service-request",
    ],
  },
  25: { films: ["hdfc-mayank-bathwal-message"] },
  29: {
    films: [
      "activ-travel-main-plan",
      "activ-travel-amt-plan",
      "activ-travel-asia-plan",
      "activ-travel-leisure-plan",
      "activ-travel-senior-plan",
      "activ-travel-student-plan",
    ],
  },
};

/* Genesis case studies sheet, 11 Oct 2026: studies 30–41 made final. */
Object.assign(sheetMedia, {
  30: { films: ["mpower-walking-cam-a-16x9"] },
  31: { films: ["abhi-reels-sept-harlem-shake", "abhi-reels-sept-gym", "abhi-reels-sept-please-please", "abhi-reels-sept-friends"] },
  32: { films: ["studios-dha-1"] },
  33: {
    films: [
      "feature-intro-videos-15-seconds-1-draft-9-eat-move-heal-health-returns-motion-graphic",
      "feature-intro-videos-15-seconds-2-draft-5-unlimited-sum-insured-motion-graphics",
      "feature-intro-videos-15-seconds-3-draft-4-travel-onoff-motion-graphic",
      "feature-intro-videos-15-seconds-4-draft-3-wwymc-motion-graphic",
      "feature-intro-videos-15-seconds-5-draft-7-opd-motion-graphic",
      "feature-intro-videos-15-seconds-6-draft-2-yuva-reload-11x-motion-graphic",
      "feature-intro-videos-15-seconds-7-draft6-income-protect-motion-graphic",
    ],
  },
  35: { films: ["studios-mahindra-cut-44"] },
  36: { films: ["studios-utsav-aftermovie"] },
  37: { films: ["studios-hdfc-x-abhi-sampoorna2-0", "studios-with-hdfc-slide"] },
  38: { films: ["studios-on-dec-1-2023-we-ushered-in-a-new-era-of-100-health-and-100-health-insurance"] },
  39: { films: ["studios-umang-2024"] },
  40: { films: ["55-power-of-10-studio-1", "studios-abhi-ex-coms"] },
  41: { gallery: [1, 2, 3, 4, 5, 6].map((i) => still(`${55 + i}-activ-health-logo-${i}`)) },
});
