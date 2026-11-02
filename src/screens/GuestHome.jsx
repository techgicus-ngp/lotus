import { useSession } from '../context/SessionContext';
import { PageHeader } from '../components/Common';
import MapsTab, { useAllowedMaps } from './MapsTab';
import { IconInfo } from '../icons';

export default function GuestHome() {
  const { user, signOut } = useSession();
  const { maps, loading, reload } = useAllowedMaps();
  return (
    <div className="page">
      <PageHeader eyebrow="GUEST ACCESS" title="Explore Layout Maps" subtitle={`Welcome, ${user.name}`} onLogout={signOut}>
        <div className="glass-note">
          <IconInfo size={20} />
          <span>Guest users can view maps and plot details but cannot create quotations</span>
        </div>
      </PageHeader>
      <MapsTab maps={maps} loading={loading} reload={reload} />
    </div>
  );
}
