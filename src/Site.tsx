import type { SiteContent, Project } from '../shared/content'
import { Header } from './components/Header'
import { ExternalLink } from './components/ExternalLink'
import { Icon } from './components/Icon'

function ProjectImage({ project }: { project: Project }) {
  return <figure className="project-visual">
    <div className="project-image-frame"><img src={project.image} alt={project.imageAlt} width="960" height="720" loading="lazy" /></div>
    {project.imageCaption && <figcaption>{project.imageCaption}</figcaption>}
  </figure>
}

export function Site({ content, preview = false }: { content: SiteContent; preview?: boolean }) {
  const { profile, openSource } = content
  const projects = content.projects.filter((item) => item.published).sort((a, b) => Number(b.featured) - Number(a.featured))
  return <div className="public-site">
    {!preview && <><a className="skip-link" href="#main">본문으로 바로가기</a><Header profile={profile} /></>}
    <main id="main" tabIndex={-1} className="content-width">
      <section id="top" className="hero" tabIndex={-1} aria-labelledby="hero-title">
        <div className="identity hero-enter"><h1 id="hero-title">{profile.name}</h1><span className="english-name">{profile.englishName}</span></div>
        <p className="role">{profile.role}</p><p className="hero-statement">{profile.tagline}</p><p className="hero-description">{profile.introduction}</p>
        <p className="school">{profile.school} {profile.schoolDetail}</p>
        <div className="hero-links"><ExternalLink href={profile.github} className="link"><Icon name="github" />GitHub<Icon name="arrow" /></ExternalLink><ExternalLink href={profile.email ? `mailto:${profile.email}` : ''} className="link"><Icon name="mail" />이메일 보내기</ExternalLink><ExternalLink href={profile.linkedin} className="link">LinkedIn<Icon name="arrow" /></ExternalLink></div>
      </section>
      <section id="work" className="section" tabIndex={-1} aria-labelledby="work-title">
        <div className="section-heading"><h2 id="work-title">프로젝트</h2><p>직접 만들고, 운영하며 배운 것들</p></div>
        <div className="project-list">{projects.map((project) => <article key={project.id} className={'project project-' + project.id + (project.featured ? ' project-featured' : '')}>
          {project.featured && <p className="featured-label">대표 프로젝트{project.status && ' · ' + project.status}</p>}
          {!project.featured && <div><h3>{project.name}</h3><p className="project-status">{project.status}</p></div>}
          <div className={project.featured ? 'project-body' + (project.image ? '' : ' no-image') : 'project-main'}><div>
            {project.featured && <h3>{project.name}</h3>}
            <p className="project-headline">{project.headline}</p><p className="project-problem">{project.problem}</p>
            <p className="project-role">담당 · {project.role}</p><p className="project-result">{project.result}</p>
            <ul className="tech-list" aria-label={project.name + ' 기술'}>{project.technologies.map((tech) => <li key={tech}>{tech}</li>)}</ul>
            <div className="project-links"><ExternalLink href={project.github} className="link underlined" label={project.name + ' GitHub (새 탭)'}>GitHub<Icon name="arrow" /></ExternalLink><ExternalLink href={project.detailUrl || project.sourceUrl} className="link" label={project.name + ' 작업 기록 (새 탭)'}>{project.detailUrl ? '자세히 보기' : '작업 기록'}<Icon name="arrow" /></ExternalLink></div>
          </div>{project.featured && project.image && <ProjectImage project={project} />}</div>
          {!project.featured && project.image && <div className="project-small-image"><ProjectImage project={project} /></div>}
        </article>)}</div>
      </section>
      <section id="open-source" className="section" tabIndex={-1} aria-labelledby="oss-title"><div className="section-heading"><h2 id="oss-title">오픈소스</h2><p>사용하는 도구에 작은 개선을 보탭니다.</p></div>
        {openSource.contributions.filter((item) => item.published && item.status !== 'reverted').slice(0, 3).map((item) => <article className="contribution" key={item.id}><h3><ExternalLink href={item.url}>{item.name}<span className="pr-number">#{item.number}</span></ExternalLink></h3><p>{item.description}</p><span className="pr-status">{({ merged: '병합됨', open: '검토 중', closed: '종료됨', reverted: '되돌려짐' })[item.status]}</span></article>)}
        <div className="oss-footer"><ExternalLink href={openSource.activityUrl} className="link underlined">전체 기여 보기<Icon name="arrow" /></ExternalLink><p>{openSource.checkedAt} 공개 기록 확인</p></div>
      </section>
      <section id="about" className="section" tabIndex={-1} aria-labelledby="about-title"><div className="section-heading"><h2 id="about-title">개발하는 방식</h2></div><div className="about-copy">{profile.about.map((paragraph, i) => <p key={i}>{paragraph}</p>)}</div><div className="skills-list">{content.skills.filter((item) => item.published).map((group) => <div className="skills-row" key={group.id}><h3>{group.name}</h3><p>{group.items.join(' · ')}</p></div>)}</div></section>
      <section id="activities" className="section" tabIndex={-1} aria-labelledby="activities-title"><div className="section-heading"><h2 id="activities-title">학교 안팎에서</h2><p>함께 만들고, 경험을 나눕니다.</p></div><ol>{content.activities.filter((item) => item.published).map((item) => <li className="activity" key={item.id}><span className="activity-period">{item.period}</span><div><h3>{item.title}</h3><p>{item.description}</p></div></li>)}</ol></section>
      <section id="contact" className="section contact" tabIndex={-1} aria-labelledby="contact-title"><div className="section-heading"><h2 id="contact-title">연락</h2></div><p>{profile.contactText}</p><div className="contact-links"><ExternalLink href={profile.email ? `mailto:${profile.email}` : ''} className="link underlined">{profile.email}<Icon name="arrow" /></ExternalLink><ExternalLink href={profile.github} className="link">GitHub<Icon name="arrow" /></ExternalLink><ExternalLink href={profile.linkedin} className="link">LinkedIn<Icon name="arrow" /></ExternalLink><ExternalLink href={profile.website} className="link">{profile.domain}<Icon name="arrow" /></ExternalLink></div></section>
    </main>
    <footer className="content-width footer"><p>© {new Date().getFullYear()} {profile.englishName}</p><a href="#top" className="link">맨 위로<Icon name="up" /></a></footer>
  </div>
}
