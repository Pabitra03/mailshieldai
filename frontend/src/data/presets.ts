export const EMAIL_PRESETS = {
  hdfc: {
    label: 'HDFC Phishing',
    tag: 'PHISHING',
    origin: 'Hong Kong',
    risk: 96.5,
    raw: `From: "HDFC Bank Security" <alerts@hdfc-secure.net>
To: victim@example.com
Subject: Final KYC Verification Notice
Date: Mon, 21 Sep 2026 02:24:00 +0530
Message-ID: <20260921022400.12345@hdfc-secure.net>
Authentication-Results: mx.example.com; spf=fail smtp.mailfrom=hdfc-secure.net; dkim=fail header.d=hdfc-secure.net; dmarc=fail action=reject
Received: from mail.hdfc-secure.net (unknown [45.77.123.45]) by mx.example.com with ESMTPS id abc123 for <victim@example.com>; Mon, 21 Sep 2026 02:24:00 +0530
Received: from localhost (localhost [127.0.0.1]) by mail.hdfc-secure.net (Postfix) with ESMTP id def456; Mon, 21 Sep 2026 02:23:55 +0530

Dear Customer,

Your HDFC Bank account will be PERMANENTLY CLOSED within 24 hours if you do not complete mandatory KYC verification immediately.

CLICK HERE TO VERIFY: https://hdfc-secure-kyc.verification-portal.top/verify?token=abc123

Failure to comply will result in account freezing and fund seizure.

HDFC Bank Security Team
`,
  },
  bec: {
    label: 'CEO Wire Fraud',
    tag: 'BEC',
    origin: 'Nigeria',
    risk: 82.1,
    raw: `From: "CEO John Smith" <john.smith@company.com>
To: finance@company.com
Subject: URGENT: Wire Transfer Required - Confidential
Date: Mon, 21 Sep 2026 02:18:00 +0530
Message-ID: <20260921021800.ceo456@company.com>
Authentication-Results: mx.company.com; spf=pass smtp.mailfrom=company.com; dkim=pass header.d=company.com; dmarc=pass action=none
Received: from mail.hosting-provider.ng (unknown [41.58.108.22]) by mx.company.com with ESMTPS id bec789; Mon, 21 Sep 2026 02:18:00 +0530

Hi,

I'm in a board meeting and need you to process an urgent wire transfer immediately. This is highly confidential - do not discuss with anyone.

Beneficiary: Global Tech Solutions Ltd
Bank: HSBC Hong Kong
Account: 848-123456-838
SWIFT: HSBCHKHHHKH
Amount: $47,500 USD
Reference: Project Alpha - Invoice #INV-2026-0892

Send confirmation once done.

Sent from my iPhone
John Smith
Chief Executive Officer
`,
  },
  novelty: {
    label: 'Malicious Macro',
    tag: 'NOVEL',
    origin: 'Hong Kong',
    risk: 62.6,
    raw: `From: "Internal IT" <support@hdfc-secure.net>
To: employee@company.com
Subject: HDFC Credit Card Statement - Security Patch
Date: Mon, 21 Sep 2026 01:45:00 +0530
Message-ID: <20260921014500.novel@hdfc-secure.net>
Authentication-Results: mx.company.com; spf=none; dkim=none; dmarc=none
Received: from proxy.unknown.vpn (unknown [185.220.101.42]) by mx.company.com with ESMTPS id nov456; Mon, 21 Sep 2026 01:45:00 +0530
Received: from tor-exit-node (tor-exit-node [185.220.101.42]) by proxy.unknown.vpn with ESMTPS id tor789; Mon, 21 Sep 2026 01:44:50 +0530

Hello Team,

Please download and execute the attached configuration file to update your system credentials.

Attachment: security_patch_v2.1.docm

This is a zero-day vulnerability patch that must be applied within 2 hours.

IT Security Division
`,
  },
  clean: {
    label: 'Safe Newsletter',
    tag: 'CLEAR',
    origin: 'Canada',
    risk: 33.8,
    raw: `From: "Industry Weekly" <newsletter@legitimate-corp.com>
To: subscriber@example.com
Subject: Weekly Industry Update - September Edition
Date: Mon, 21 Sep 2026 01:45:00 +0000
Message-ID: <20260921014500.news@legitimate-corp.com>
Authentication-Results: mx.example.com; spf=pass smtp.mailfrom=legitimate-corp.com; dkim=pass header.d=legitimate-corp.com; dmarc=pass action=none
Received: from smtp-out.newsletter-service.com (smtp-out.newsletter-service.com [198.51.100.22]) by mx.example.com with ESMTPS id tc123; Mon, 21 Sep 2026 01:45:00 +0000

Good morning,

This week's industry briefing covers supply-chain resilience, SOC automation, and Q3 funding.

Read the full newsletter: https://legitimate-corp.com/weekly/2026-09

Unsubscribe: https://legitimate-corp.com/unsubscribe

Legitimate Corp | Toronto, Canada
`,
  },
} as const;

export type PresetKey = keyof typeof EMAIL_PRESETS;

export const PIPELINE_STAGES = [
  { id: 1, name: 'Email (RFC 822)', detail: 'Headers + MIME parsed' },
  { id: 2, name: 'Identity Analysis', detail: 'Spoofing / look-alike check' },
  { id: 3, name: 'Authentication Cryptex', detail: 'SPF / DKIM / DMARC' },
  { id: 4, name: 'Network Origin', detail: 'ASN + hop attribution' },
  { id: 5, name: 'Threat Intelligence', detail: 'Syndicate / campaign flags' },
  { id: 6, name: 'ML Risk Engine', detail: '5-model ensemble score' },
  { id: 7, name: 'Final Verdict', detail: 'Sealed into Merkle ledger' },
] as const;
