import { useState } from 'react'
import type { SiteContent, Project } from '../shared/content'
import { Header } from './components/Header'
import { ExternalLink } from './components/ExternalLink'
import { Icon } from './components/Icon'
import { Lightbox } from './components/Lightbox'

const STATUS_LABEL: Record<string, string> = { merged: '병합됨', open: '검토 중', closed: '닫힘', reverted: '되돌려짐' }

export function Site({ content, preview = false }: { content: SiteContent; preview?: boolean }) {
  const { profile } = content
  const projects = content.projects.filter((item) => item.published)
  const ways = content.ways.filter((item) => item.published)
  const oss = content.openSource.contributions.filter((item) => item.published && item.status !== 'reverted')
  const activities = content.activities.filter((item) => item.published)
  const hasOss = oss.length > 0
  const hasActivities = activities.length > 0
  const hasPortfolio = Boolean(profile.portfolio.url)

  const [selected, setSelected] = useState(projects[0]?.id)
  const currentIndex = Math.max(0, projects.findIndex((project) => project.id === selected))
  const current: Project | undefined = projects[currentIndex]
  const next = projects.length > 1 ? projects[(currentIndex + 1) % projects.length] : undefined
  const select = (id: string) => { setSelected(id); setLightbox(null) }
  const shots = current?.screenshots.filter((shot) => shot.published && shot.image) ?? []
  const docs = current?.documents.filter((doc) => doc.published) ?? []
  const [lightbox, setLightbox] = useState<number | null>(null)

  const initials = profile.name.slice(-2)
  const links = [
    profile.github ? { label: 'GitHub', href: profile.github, text: profile.github.replace(/^https:\/\//, '').replace(/\/$/, ''), external: true } : null,
    { label: '웹사이트', href: profile.website, text: profile.domain, external: false },
    profile.email ? { label: '이메일', href: 'mailto:' + profile.email, text: profile.email, external: false } : null,
    profile.linkedin ? { label: 'LinkedIn', href: profile.linkedin, text: profile.linkedin.replace(/^https:\/\//, '').replace(/\/$/, ''), external: true } : null,
    hasPortfolio ? { label: '포트폴리오 PDF', href: profile.portfolio.url, text: profile.portfolio.label, external: true } : null,
  ].filter((item): item is { label: string; href: string; text: string; external: boolean } => item !== null)

  return <div className="site">
    {!preview && <a className="skip" href="#main">본문으로 바로가기</a>}
    {!preview && <Header profile={profile} hasOss={hasOss} hasActivities={hasActivities} />}
    <main id="main" tabIndex={-1}>
      <div className="wrap">
        <section id="top" className="hero" aria-labelledby="hero-name">
          <div>
            <p className="school enter"><Icon name="cap" /><span>{profile.school}</span></p>
            <h1 id="hero-name" className="enter d2">{profile.name}</h1>
            <p className="role enter d2">{profile.role}</p>
            <p className="lede enter d3" style={{ whiteSpace: 'pre-line' }}>{profile.tagline}{'\n'}{profile.introduction}</p>
            <div className="ctas enter d3">
              <a className="btn primary" href="#projects">프로젝트 보기<Icon name="down" /></a>
              {profile.github && <ExternalLink href={profile.github} className="btn">GitHub<Icon name="external" /></ExternalLink>}
              {hasPortfolio && <ExternalLink href={profile.portfolio.url} className="btn">포트폴리오 PDF<Icon name="down" /></ExternalLink>}
            </div>
          </div>
          <nav className="board enter d3" aria-labelledby="board-title">
            <h2 id="board-title">맡았던 프로젝트</h2>
            {projects.map((project) => (
              <a key={project.id} className="prow" href="#projects" onClick={() => select(project.id)}>
                <i style={{ background: project.color }} aria-hidden="true" />
                <b>{project.name}</b><span>{project.role}</span><Icon name="chevronRight" />
              </a>
            ))}
            {hasOss && <a className="prow last" href="#oss">
              <i style={{ background: 'var(--soft)' }} aria-hidden="true" />
              <b>오픈소스</b><span>{oss[0].name}{oss.length > 1 ? ` 외 ${oss.length - 1}곳` : ''}</span><Icon name="chevronRight" />
            </a>}
          </nav>
        </section>
      </div>

      <section id="projects" className="sec" aria-labelledby="projects-title" tabIndex={-1}>
        <div className="wrap">
          <div className="sec-hd"><h2 id="projects-title">프로젝트</h2><p>학교에서 학생들이 실제로 쓰는 서비스입니다.</p></div>
          {current && <div className="px">
            <div className="ptabs" role="group" aria-label="프로젝트 선택">
              {projects.map((project) => (
                <button key={project.id} type="button" className={'ptab' + (project.id === current.id ? ' sel' : '')} aria-pressed={project.id === current.id} onClick={() => select(project.id)}>
                  <span className="ptab-name"><i style={{ background: project.color }} aria-hidden="true" />{project.name}</span>
                  <span className="ptab-desc">{project.headline}</span>
                </button>
              ))}
            </div>
            <article className="pdetail" key={current.id} aria-labelledby="pd-title">
              <div className="pd-top">
                <div><h3 id="pd-title"><i style={{ background: current.color }} aria-hidden="true" />{current.name}</h3><p className="pd-one">{current.headline}</p></div>
                {current.status && <span className="status"><i aria-hidden="true" />{current.status}</span>}
              </div>
              {current.image && <figure className="shot"><img src={current.image} alt={current.imageAlt} loading="lazy" width="1600" height="900" /></figure>}
              {shots.length > 0 && <>
                <h4 className="pd-h">화면</h4>
                <div className="shots" role="list">{shots.map((shot, index) => (
                  <button type="button" key={shot.id} role="listitem" className="shot-thumb" onClick={() => setLightbox(index)} aria-label={`${shot.alt} 크게 보기 (${index + 1}/${shots.length})`}>
                    <img src={shot.image} alt="" loading="lazy" width="300" height="300" />
                  </button>
                ))}</div>
                <Lightbox items={shots.map((shot) => ({ image: shot.image, alt: shot.alt, caption: shot.caption }))} index={lightbox} onClose={() => setLightbox(null)} onNavigate={setLightbox} />
              </>}
              <dl className="facts">
                <div><dt>팀</dt><dd>{current.team || '—'}</dd></div>
                <div><dt>내 역할</dt><dd>{current.role}</dd></div>
                <div><dt>기술</dt><dd><div className="tech">{current.technologies.map((tech) => <span key={tech}>{tech}</span>)}</div></dd></div>
              </dl>
              <h4 className="pd-h">맡은 일</h4>
              <ul className="work">{current.work.map((item, index) => <li key={index}>{item}</li>)}</ul>
              {docs.length > 0 && <>
                <h4 className="pd-h">문서</h4>
                <ul className="docs">{docs.map((doc) => {
                  let domain = doc.url
                  try { domain = new URL(doc.url).hostname } catch { /* keep raw url if unparsable */ }
                  return <li key={doc.id}><a className="doc-link" href={doc.url} target="_blank" rel="noopener noreferrer"><Icon name="doc" /><b>{doc.label}</b><em>{domain}</em><Icon name="external" /></a></li>
                })}</ul>
              </>}
              {current.note && <p className="note">{current.note}</p>}
              <div className="pd-foot">
                <div className="pd-links">{current.github && <ExternalLink href={current.github} className="btn sm">GitHub 저장소<Icon name="external" /></ExternalLink>}</div>
                {next && <button type="button" className="btn sm" onClick={() => select(next.id)}>다음 · {next.name}<Icon name="arrowRight" /></button>}
              </div>
            </article>
          </div>}
        </div>
      </section>

      <section id="about" className="sec" aria-labelledby="about-title" tabIndex={-1}>
        <div className="wrap">
          <div className="sec-hd"><h2 id="about-title">해 온 일</h2><p>세 프로젝트에서 맡았던 일을 종류별로 묶었습니다.</p></div>
          <ul className="ways">{ways.map((way) => (
            <li className="way" key={way.id}><h3>{way.title}{way.sub && <small>{way.sub}</small>}</h3><p>{way.text}</p></li>
          ))}</ul>
        </div>
      </section>

      {hasOss && <section id="oss" className="sec" aria-labelledby="oss-title" tabIndex={-1}>
        <div className="wrap">
          <div className="sec-hd"><h2 id="oss-title">오픈소스 기여</h2><p>직접 보낸 PR과 바꾼 내용입니다.</p></div>
          <ul className="oss">{oss.map((item) => (
            <li className="orow" key={item.id}>
              <span className="oname">{item.name}{item.repo && <span className="orepo">{item.repo}</span>}</span>
              <span className="ochange">{item.description}</span>
              <a className="olink" href={item.url} target="_blank" rel="noopener noreferrer" aria-label={`${item.name} PR #${item.number} ${STATUS_LABEL[item.status]}, 새 탭에서 열기`}>
                PR #{item.number} <em>{STATUS_LABEL[item.status]}</em><Icon name="external" />
              </a>
            </li>
          ))}</ul>
          {profile.github && <div className="oss-more"><span>나머지 PR은 GitHub에서 볼 수 있습니다.</span>
            <ExternalLink href={profile.github} className="btn sm">GitHub 프로필<Icon name="external" /></ExternalLink>
          </div>}
        </div>
      </section>}

      {hasActivities && <section id="activity" className="sec" aria-labelledby="activity-title" tabIndex={-1}>
        <div className="wrap">
          <div className="sec-hd"><h2 id="activity-title">학교 활동</h2><p>프로젝트 밖에서 사람들과 함께한 일입니다.</p></div>
          <ul className="acts">{activities.map((item) => (
            <li key={item.id}><span className="when">{item.period || '—'}</span><div><h3>{item.title}</h3>{item.description && <p>{item.description}</p>}</div></li>
          ))}</ul>
        </div>
      </section>}

      <section id="contact" className="sec" aria-labelledby="contact-title" tabIndex={-1}>
        <div className="wrap">
          <div className="sec-hd"><h2 id="contact-title">연락</h2></div>
          <div className="card">
            {profile.photo.image ? <img className="avatar" src={profile.photo.image} alt={profile.photo.alt} width="80" height="80" loading="lazy" /> : <div className="avatar" aria-hidden="true">{initials}</div>}
            <div>
              <h3>{profile.name}</h3>
              <p className="who">{profile.role} · {profile.schoolShort}</p>
              <p className="msg">{profile.contactText}</p>
            </div>
            <div className="links">{links.map((item) => (
              <a key={item.label} className="lk" href={item.href} target={item.external ? '_blank' : undefined} rel={item.external ? 'noopener noreferrer' : undefined}>
                <Icon name="link" /><b>{item.label}</b><span>{item.text}</span>
              </a>
            ))}</div>
          </div>
        </div>
      </section>
    </main>
    {!preview && <footer className="wrap foot"><span>© {profile.name}</span><a href="#top">맨 위로 ↑</a></footer>}
  </div>
}
