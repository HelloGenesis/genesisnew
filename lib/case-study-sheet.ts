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
    "headline": "Inside Genesis Media's Video Production for Mpower Minds x ABHI",
    "campaign": "Mpower Minds x ABHI",
    "service": "Video production, motion design and content adaptation",
    "industry": "Health insurance and wellness",
    "keyword": "video production agency Mumbai",
    "executionNote": "Genesis delivered the campaign video assets and platform-ready adaptations, with creative direction designed to keep the central idea consistent across every format.",
    "takeaway": "Mpower Minds x ABHI demonstrates how Genesis Media can translate a clear marketing objective into a practical content system, combining strategy, production and delivery while keeping the audience experience easy to understand.",
    "brand": "Aditya Birla Health Insurance",
    "brief": [
      "Genesis developed four focused films with psychologist Dr Reet Patel, pairing one useful question per video with a warm on-camera tone and adaptations for landscape and vertical formats.",
      "The film needed to communicate quickly across digital and presentation environments. Genesis therefore had to balance information, visual pace and brand accuracy while planning for multiple versions and attention spans."
    ],
    "approach": [
      "Genesis built the narrative around one clear promise: mental-health expertise made human. The information was sequenced into short story steps so viewers could follow the message without the film becoming a list of disconnected claims or event moments.",
      "The approach was effective because it reduced the message to a clear viewing journey. Strong information hierarchy and planned versioning made the content useful beyond a single placement or moment."
    ],
    "execution": [
      "Script and narrative structure",
      "Production, editing and motion-graphics treatment",
      "Primary master and channel-specific adaptations"
    ],
    "results": [
      "For brand and marketing teams, this shows how Genesis can turn complex information or live production moments into clear, reusable video content."
    ]
  },
  "31": {
    "headline": "Inside Genesis Media's Video Production for ABHI Diabetes Awareness",
    "campaign": "ABHI Diabetes Awareness",
    "service": "Video production, motion design and content adaptation",
    "industry": "Health insurance and wellness",
    "keyword": "video production agency Mumbai",
    "executionNote": "Genesis delivered the campaign video assets and platform-ready adaptations, with creative direction designed to keep the central idea consistent across every format.",
    "takeaway": "ABHI Diabetes Awareness demonstrates how Genesis Media can translate a clear marketing objective into a practical content system, combining strategy, production and delivery while keeping the audience experience easy to understand.",
    "brand": "Aditya Birla Health Insurance",
    "brief": [
      "Genesis used a recognisable social scenario and comedy to hold attention before landing the importance of diabetes awareness and health protection.",
      "The film needed to communicate quickly across digital and presentation environments. Genesis therefore had to balance information, visual pace and brand accuracy while planning for multiple versions and attention spans."
    ],
    "approach": [
      "Genesis built the narrative around one clear promise: humour opens a serious health conversation. The information was sequenced into short story steps so viewers could follow the message without the film becoming a list of disconnected claims or event moments.",
      "The approach was effective because it reduced the message to a clear viewing journey. Strong information hierarchy and planned versioning made the content useful beyond a single placement or moment."
    ],
    "execution": [
      "Script and narrative structure",
      "Production, editing and motion-graphics treatment",
      "Primary master and channel-specific adaptations"
    ],
    "results": [
      "For brand and marketing teams, this shows how Genesis can turn complex information or live production moments into clear, reusable video content."
    ]
  },
  "32": {
    "headline": "Inside Genesis Media's Video Production for DHA Face Scan",
    "campaign": "DHA Face Scan",
    "service": "Video production, motion design and content adaptation",
    "industry": "Health insurance and wellness",
    "keyword": "video production agency Mumbai",
    "executionNote": "Genesis delivered the campaign video assets and platform-ready adaptations, with creative direction designed to keep the central idea consistent across every format.",
    "takeaway": "DHA Face Scan demonstrates how Genesis Media can translate a clear marketing objective into a practical content system, combining strategy, production and delivery while keeping the audience experience easy to understand.",
    "brand": "Aditya Birla Health Insurance",
    "brief": [
      "Genesis created a presenter-led explainer around the Digital Health Assessment face scan, pairing a human guide with concise visual cues so users can understand the action quickly.",
      "The film needed to communicate quickly across digital and presentation environments. Genesis therefore had to balance information, visual pace and brand accuracy while planning for multiple versions and attention spans."
    ],
    "approach": [
      "Genesis built the narrative around one clear promise: a health assessment made easy to understand. The information was sequenced into short story steps so viewers could follow the message without the film becoming a list of disconnected claims or event moments.",
      "The approach was effective because it reduced the message to a clear viewing journey. Strong information hierarchy and planned versioning made the content useful beyond a single placement or moment."
    ],
    "execution": [
      "Script and narrative structure",
      "Production, editing and motion-graphics treatment",
      "Primary master and channel-specific adaptations"
    ],
    "results": [
      "For brand and marketing teams, this shows how Genesis can turn complex information or live production moments into clear, reusable video content."
    ]
  },
  "33": {
    "headline": "Inside Genesis Media's Video Production for Income Protect Cover",
    "campaign": "Income Protect Cover",
    "service": "Video production, motion design and content adaptation",
    "industry": "Health insurance and wellness",
    "keyword": "BFSI video production",
    "executionNote": "Genesis delivered the campaign video assets and platform-ready adaptations, with creative direction designed to keep the central idea consistent across every format.",
    "takeaway": "Income Protect Cover demonstrates how Genesis Media can translate a clear marketing objective into a practical content system, combining strategy, production and delivery while keeping the audience experience easy to understand.",
    "brand": "Aditya Birla Health Insurance",
    "brief": [
      "Genesis visualised eligibility, continuous hospitalisation and the distinction between income protection and hospital bills using a clear AI-led narrative built for social viewing.",
      "The film needed to communicate quickly across digital and presentation environments. Genesis therefore had to balance information, visual pace and brand accuracy while planning for multiple versions and attention spans."
    ],
    "approach": [
      "Genesis built the narrative around one clear promise: complex insurance logic simplified through ai storytelling. The information was sequenced into short story steps so viewers could follow the message without the film becoming a list of disconnected claims or event moments.",
      "The approach was effective because it reduced the message to a clear viewing journey. Strong information hierarchy and planned versioning made the content useful beyond a single placement or moment."
    ],
    "execution": [
      "Script and narrative structure",
      "Production, editing and motion-graphics treatment",
      "Primary master and channel-specific adaptations"
    ],
    "results": [
      "For brand and marketing teams, this shows how Genesis can turn complex information or live production moments into clear, reusable video content."
    ]
  },
  "34": {
    "headline": "Inside Genesis Media's Video Production for Eat Move Heal",
    "campaign": "Eat Move Heal",
    "service": "Video production, motion design and content adaptation",
    "industry": "Health insurance and wellness",
    "keyword": "video production agency Mumbai",
    "executionNote": "Genesis delivered the campaign video assets and platform-ready adaptations, with creative direction designed to keep the central idea consistent across every format.",
    "takeaway": "Eat Move Heal demonstrates how Genesis Media can translate a clear marketing objective into a practical content system, combining strategy, production and delivery while keeping the audience experience easy to understand.",
    "brand": "Aditya Birla Health Insurance",
    "brief": [
      "Genesis used playful motion and game-inspired visual language to connect nutrition, movement and recovery into a memorable health journey.",
      "The film needed to communicate quickly across digital and presentation environments. Genesis therefore had to balance information, visual pace and brand accuracy while planning for multiple versions and attention spans."
    ],
    "approach": [
      "Genesis built the narrative around one clear promise: wellness behaviours connected in one energetic system. The information was sequenced into short story steps so viewers could follow the message without the film becoming a list of disconnected claims or event moments.",
      "The approach was effective because it reduced the message to a clear viewing journey. Strong information hierarchy and planned versioning made the content useful beyond a single placement or moment."
    ],
    "execution": [
      "Script and narrative structure",
      "Production, editing and motion-graphics treatment",
      "Primary master and channel-specific adaptations"
    ],
    "results": [
      "For brand and marketing teams, this shows how Genesis can turn complex information or live production moments into clear, reusable video content."
    ]
  },
  "35": {
    "headline": "Inside Genesis Media's Video Production for Mahindra Finance Founders' Day 2025",
    "campaign": "Mahindra Finance Founders' Day 2025",
    "service": "Event content production and social-first editing",
    "industry": "BFSI and financial services",
    "keyword": "event content production",
    "executionNote": "Genesis delivered the campaign video assets and platform-ready adaptations, with creative direction designed to keep the central idea consistent across every format.",
    "takeaway": "Mahindra Finance Founders' Day 2025 demonstrates how Genesis Media can translate a clear marketing objective into a practical content system, combining strategy, production and delivery while keeping the audience experience easy to understand.",
    "brand": "Mahindra Finance",
    "brief": [
      "Genesis shaped leadership and team moments into an event film that records the occasion while retaining the warmth of a people-led culture story.",
      "The film needed to communicate quickly across digital and presentation environments. Genesis therefore had to balance information, visual pace and brand accuracy while planning for multiple versions and attention spans."
    ],
    "approach": [
      "Genesis built the narrative around one clear promise: a milestone film built around people and legacy. The information was sequenced into short story steps so viewers could follow the message without the film becoming a list of disconnected claims or event moments.",
      "The approach was effective because it reduced the message to a clear viewing journey. Strong information hierarchy and planned versioning made the content useful beyond a single placement or moment."
    ],
    "execution": [
      "Event coverage plan and story beats",
      "Multi-zone production and rapid editorial workflow",
      "Vertical, landscape and social-first deliverables"
    ],
    "results": [
      "For brand and marketing teams, this shows how Genesis can turn complex information or live production moments into clear, reusable video content."
    ]
  },
  "36": {
    "headline": "Inside Genesis Media's Video Production for ABHI Utsav Milestone",
    "campaign": "ABHI Utsav Milestone",
    "service": "Event content production and social-first editing",
    "industry": "Health insurance and wellness",
    "keyword": "event content production",
    "executionNote": "Genesis delivered the campaign video assets and platform-ready adaptations, with creative direction designed to keep the central idea consistent across every format.",
    "takeaway": "ABHI Utsav Milestone demonstrates how Genesis Media can translate a clear marketing objective into a practical content system, combining strategy, production and delivery while keeping the audience experience easy to understand.",
    "brand": "Aditya Birla Health Insurance",
    "brief": [
      "Genesis captured leadership moments and programme highlights, then shaped them into a social-first aftermovie rather than a chronological event record.",
      "The film needed to communicate quickly across digital and presentation environments. Genesis therefore had to balance information, visual pace and brand accuracy while planning for multiple versions and attention spans."
    ],
    "approach": [
      "Genesis built the narrative around one clear promise: leadership and event content designed for digital life. The information was sequenced into short story steps so viewers could follow the message without the film becoming a list of disconnected claims or event moments.",
      "The approach was effective because it reduced the message to a clear viewing journey. Strong information hierarchy and planned versioning made the content useful beyond a single placement or moment."
    ],
    "execution": [
      "Event coverage plan and story beats",
      "Multi-zone production and rapid editorial workflow",
      "Vertical, landscape and social-first deliverables"
    ],
    "results": [
      "For brand and marketing teams, this shows how Genesis can turn complex information or live production moments into clear, reusable video content."
    ]
  },
  "37": {
    "headline": "Inside Genesis Media's Video Production for HDFC Bank x ABHI",
    "campaign": "HDFC Bank x ABHI",
    "service": "Video production, motion design and content adaptation",
    "industry": "Health insurance and wellness",
    "keyword": "BFSI video production",
    "executionNote": "Genesis delivered the campaign video assets and platform-ready adaptations, with creative direction designed to keep the central idea consistent across every format.",
    "takeaway": "HDFC Bank x ABHI demonstrates how Genesis Media can translate a clear marketing objective into a practical content system, combining strategy, production and delivery while keeping the audience experience easy to understand.",
    "brand": "HDFC Bank and Aditya Birla Health Insurance",
    "brief": [
      "Genesis reorganised detailed insurance information into clear steps, visual supers and motion-led explanations. Versioning supported partner and product contexts without rebuilding the complete narrative.",
      "The film needed to communicate quickly across digital and presentation environments. Genesis therefore had to balance information, visual pace and brand accuracy while planning for multiple versions and attention spans."
    ],
    "approach": [
      "Genesis built the narrative around one clear promise: insurance explainers people can follow. The information was sequenced into short story steps so viewers could follow the message without the film becoming a list of disconnected claims or event moments.",
      "The approach was effective because it reduced the message to a clear viewing journey. Strong information hierarchy and planned versioning made the content useful beyond a single placement or moment."
    ],
    "execution": [
      "Script and narrative structure",
      "Production, editing and motion-graphics treatment",
      "Primary master and channel-specific adaptations"
    ],
    "results": [
      "For brand and marketing teams, this shows how Genesis can turn complex information or live production moments into clear, reusable video content."
    ]
  },
  "38": {
    "headline": "Inside Genesis Media's Video Production for Unveiling Activ One",
    "campaign": "Unveiling Activ One",
    "service": "Event content production and social-first editing",
    "industry": "Health insurance and wellness",
    "keyword": "event content production",
    "executionNote": "Genesis delivered the campaign video assets and platform-ready adaptations, with creative direction designed to keep the central idea consistent across every format.",
    "takeaway": "Unveiling Activ One demonstrates how Genesis Media can translate a clear marketing objective into a practical content system, combining strategy, production and delivery while keeping the audience experience easy to understand.",
    "brand": "Aditya Birla Health Insurance",
    "brief": [
      "Genesis planned dynamic coverage, brand-led story beats and pace-focused editing so the launch film communicated the character of Activ One and continued to work as an evergreen digital asset. The film needed to communicate quickly across digital and presentation environments. Genesis therefore had to balance information, visual pace and brand accuracy while planning for multiple versions and attention spans."
    ],
    "approach": [
      "Genesis built the narrative around one clear promise: a launch event built to live beyond the room. The information was sequenced into short story steps so viewers could follow the message without the film becoming a list of disconnected claims or event moments.",
      "The approach was effective because it reduced the message to a clear viewing journey. Strong information hierarchy and planned versioning made the content useful beyond a single placement or moment."
    ],
    "execution": [
      "Event coverage plan and story beats",
      "Multi-zone production and rapid editorial workflow",
      "Vertical, landscape and social-first deliverables"
    ],
    "results": [
      "For brand and marketing teams, this shows how Genesis can turn complex information or live production moments into clear, reusable video content."
    ]
  },
  "39": {
    "headline": "Inside Genesis Media's Video Production for UMANG 2024",
    "campaign": "UMANG 2024",
    "service": "Event content production and social-first editing",
    "industry": "Health insurance and wellness",
    "keyword": "event content production",
    "executionNote": "Genesis delivered the campaign video assets and platform-ready adaptations, with creative direction designed to keep the central idea consistent across every format.",
    "takeaway": "UMANG 2024 demonstrates how Genesis Media can translate a clear marketing objective into a practical content system, combining strategy, production and delivery while keeping the audience experience easy to understand.",
    "brand": "Aditya Birla Health Insurance",
    "brief": [
      "Genesis coordinated creative direction, production, videography and editing across multiple zones, stages, leadership moments and performances, producing both vertical and landscape assets in a compressed window.",
      "The film needed to communicate quickly across digital and presentation environments. Genesis therefore had to balance information, visual pace and brand accuracy while planning for multiple versions and attention spans."
    ],
    "approach": [
      "Genesis built the narrative around one clear promise: high-volume event content delivered at speed. The information was sequenced into short story steps so viewers could follow the message without the film becoming a list of disconnected claims or event moments.",
      "The approach was effective because it reduced the message to a clear viewing journey. Strong information hierarchy and planned versioning made the content useful beyond a single placement or moment."
    ],
    "execution": [
      "Event coverage plan and story beats",
      "Multi-zone production and rapid editorial workflow",
      "Vertical, landscape and social-first deliverables"
    ],
    "results": [
      "For brand and marketing teams, this shows how Genesis can turn complex information or live production moments into clear, reusable video content."
    ]
  },
  "41": {
    "headline": "Activ Health App: Making a Familiar Mark Work at App Size",
    "campaign": "Activ Health App Logo",
    "service": "Logo icon revamp and concept exploration",
    "industry": "Health insurance and wellness",
    "keyword": "app icon logo redesign case study",
    "executionNote": "The supplied design documents concept exploration and feedback, not a final approved logo or live rollout.",
    "takeaway": "An app identity must remain recognisable when reduced to an icon. The exploration shows how fewer details and stronger geometry can refine a familiar mark for digital use.",
    "brand": "Aditya Birla Health Insurance",
    "brief": [
      "The Activ Health App brings health tracking, rewards, policy information and care services into one digital experience. Its logo had to carry that breadth of purpose in a very small space: an app icon.",
      "The existing symbol already had recognition, but multiple cuts, shadows and an orange gradient made it visually complex. The challenge was to make it clearer and more contemporary while keeping the shape familiar."
    ],
    "approach": [
      "Genesis explored a simplified boomerang form around forward motion, momentum, balance and wellness. The proposed direction reduced visual noise, replaced gradients with solid red and yellow, and used geometry to suggest care without relying on a literal medical symbol."
    ],
    "execution": [
      "Early sketches and form explorations led to a preferred direction; feedback called for red to lead and the ends of the mark to be more symmetrical."
    ]
  }
};

/** Studies the sheet merged into another: their number, and the study that now carries them. */
export const mergedStudies: Record<number, number> = {"40": 20, "42": 21};

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
