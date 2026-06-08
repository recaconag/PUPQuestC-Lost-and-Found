import { BiSupport } from "react-icons/bi";
import { TbReport } from "react-icons/tb";
import { FaSearch } from "react-icons/fa";
import { IoLocationSharp, IoShieldCheckmark } from "react-icons/io5";
import { FaGift } from "react-icons/fa6";
import { useGetServicesQuery } from "../../redux/api/api";
import type { ReactElement } from "react";

interface Service {
  id?: string;
  title: string;
  description: string;
  icon?: string;
}

// Icon mapping for fallback services
const getServiceIcon = (title: string): ReactElement => {
  const iconMapping: { [key: string]: ReactElement } = {
    "Report Lost Items": <TbReport size="30" />,
    "Browse Found Items": <FaSearch size="30" />,
    "Campus Locations": <IoLocationSharp size="33" />,
    "Help and Assistance": <BiSupport size="30" />,
    "Safe and Secure": <IoShieldCheckmark size="30" />,
    "Claiming Items": <FaGift size="27" />,
  };

  return iconMapping[title] || <FaSearch size="30" />;
};

const defaultServices: Service[] = [
  {
    title: "Report Lost Items",
    description:
      "Submit details about missing belongings, including item descriptions, locations, and photos.",
  },
  {
    title: "Browse Found Items",
    description:
      "Check reported found items and search for belongings that may match your missing item.",
  },
  {
    title: "Campus Locations",
    description:
      "View where lost or found items were last reported around the PUPQC campus.",
  },
  {
    title: "Help and Assistance",
    description:
      "Get support for reports, claims, or other concerns related to lost and found items.",
  },
  {
    title: "Safe and Secure",
    description:
      "Your submitted information and reports are handled securely within the system.",
  },
  {
    title: "Claiming Items",
    description:
      "Verified users can request and claim reported items through the system.",
  },
];

const Services = () => {
  const { data: servicesData, isLoading } = useGetServicesQuery({});

  if (isLoading) {
    return (
      <section className="py-16 lg:py-20 bg-gray-950">
        <div className="px-4 sm:px-6 lg:px-8 mx-auto max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="animate-pulse rounded-xl border border-gray-700 bg-gray-800/60 p-6">
                <div className="h-8 w-8 bg-gray-600 rounded mb-4" />
                <div className="h-5 bg-gray-600 rounded w-3/4 mb-3" />
                <div className="space-y-2">
                  <div className="h-3 bg-gray-700 rounded w-full" />
                  <div className="h-3 bg-gray-700 rounded w-5/6" />
                  <div className="h-3 bg-gray-700 rounded w-4/6" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Use server data if available, otherwise fallback to static data
  const services: Service[] = servicesData?.data || defaultServices;
  return (
    <section
      id="services"
      className="py-16 lg:py-20 bg-gray-950"
    >
      <div className="px-4 sm:px-6 lg:px-8 mx-auto max-w-7xl">
        <div className="mx-auto flex max-w-4xl flex-col items-center space-y-4 text-center mb-16">
          <h2 className="text-4xl md:text-5xl tracking-tight font-bold leading-tight gold-text">
            How{" "}
            <span className="bg-gradient-to-r from-red-700 to-yellow-500 bg-clip-text text-transparent">
              PUPQuestC Helps
            </span>
          </h2>
          <p className="mb-6 font-light text-gray-300 text-lg md:text-xl max-w-2xl">
            Tools and features that make reporting and finding lost items easier within the PUPQC campus.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service: Service, index: number) => (
            <div
              key={service.id || index}
              className="glass-card rounded-xl p-6 hover:scale-[1.02] transition-all duration-200 group"
            >
              <div className="flex flex-col space-y-4">
                <div className="text-yellow-500 transition-colors duration-200">
                  {getServiceIcon(service.title)}
                </div>
                <div className="space-y-3">
                  <h3 className="font-semibold text-base text-white">
                    {service.title}
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    {service.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
