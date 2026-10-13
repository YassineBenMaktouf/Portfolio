export function fixtureContent() {
  return {
    person: {
      name: 'Yassine Ben Maktouf',
      role: { en: 'Actuary · Data Scientist', fr: 'Actuaire · Data Scientist' },
      photo: '', email: 'yassine@example.com', linkedin: 'https://www.linkedin.com/in/example',
      github: 'https://github.com/example',
      cv: { en: 'cv/CV-Yassine-Ben-Maktouf-EN.pdf', fr: 'cv/CV-Yassine-Ben-Maktouf-FR.pdf' }
    },
    islands: [
      { id: 'about', kind: 'about', title: { en: 'About me', fr: 'À propos' },
        scrolls: [{ bio: { en: 'Bio', fr: 'Bio FR' }, homePort: { en: 'Tunis' }, languages: { en: 'FR · EN' }, seeking: { en: 'Actuarial analyst' } }] },
      { id: 'education', kind: 'education', title: { en: 'Education', fr: 'Formation' },
        scrolls: [{ degree: { en: 'Actuarial Science' }, school: 'Uni', city: { en: 'Tunis' }, years: '2021 – 2026', summary: { en: 'Summary' }, courses: [{ en: 'Reserving' }] }] },
      { id: 'experience', kind: 'experience', title: { en: 'Experience', fr: 'Expérience' },
        scrolls: [{ role: { en: 'Actuarial intern' }, company: 'Co', city: { en: 'Tunis' }, dates: { en: '2025' }, points: [{ en: 'Built X' }], tools: ['Python'] }] },
      { id: 'projects', kind: 'project', title: { en: 'Projects', fr: 'Projets' },
        scrolls: [{ title: { en: 'Reserving model' }, category: 'actuarial', summary: { en: 'Chain ladder' }, illustration: 'triangle', tools: ['Python'], links: [{ label: { en: 'GitHub' }, url: 'https://github.com/example/repo' }] }] },
      { id: 'skills', kind: 'skills', title: { en: 'Skills & certifications', fr: 'Compétences & certifications' },
        scrolls: [
          { type: 'skills', groups: [{ name: { en: 'Actuarial' }, items: ['Pricing', 'Reserving'] }] },
          { type: 'certifications', items: [{ name: { en: 'Cert A' }, issuer: 'Org', year: '2025' }] }
        ] }
    ]
  };
}
