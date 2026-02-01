import { PageInnerLayout } from '@/layouts';
import { config } from '@/config';

const BASE_URL = config.baseUrl;

export default function QueuesPage() {
  const handleOpenBullBoard = () => {
    window.open(`${BASE_URL}/bull-board`, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
  };

  return (
    <PageInnerLayout Header={<Header />}>
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Bull Queue Board</h2>
          <p className="text-gray-600 mb-6">Monitor and manage your background job queues</p>
          <button
            onClick={handleOpenBullBoard}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            Open Bull Board
          </button>
        </div>
      </div>
    </PageInnerLayout>
  );
}

const Header = () => null;
